// src/app/user/kyc/page.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle,
  AlertCircle,
  Camera,
  Upload,
  FileText,
  User,
  Shield,
  Clock,
  X,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Eye,
  Home,
  CreditCard,
  Zap
} from 'lucide-react'

const KYC_BUCKET = 'kyc-docs'
type Step = 1 | 2 | 3 | 4 | 5 | 6

export default function KycPage() {
  const router = useRouter()
  const supaClient = useSupabaseClient()
  const session = useSession()

  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>(1)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // form data
  const [docType, setDocType] = useState('')
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [addrFile, setAddrFile] = useState<File | null>(null)
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null)
  const [faceImageUrl, setFaceImageUrl] = useState<string | null>(null)

  // face-api
  const [faceapi, setFaceapi] = useState<any>(null)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<'unknown' | 'granted' | 'denied' | 'unavailable'>('unknown')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  }

  // Step configurations
  const steps = [
    { number: 1, title: 'Documents', icon: FileText, description: 'Upload your ID documents' },
    { number: 2, title: 'Face Scan', icon: Camera, description: 'Live face verification' },
    { number: 3, title: 'Address', icon: Home, description: 'Proof of address' }
  ]

  // 1️⃣ on mount, fetch last submission status
  useEffect(() => {
    if (session === undefined) {
      return
    }
  
    if (session === null) {
      router.replace('/auth/login')
      return
    }
  
    const userId = session.user.id
    async function loadKycStatus() {
      const { data, error } = await supaClient
        .from('user_kyc_submissions')
        .select('kyc_status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
  
      if (!error && data) {
        switch (data.kyc_status) {
          case 'pending': setStep(4); break
          case 'approved': setStep(6); break
          case 'rejected': setStep(5); break
        }
      }
  
      setLoading(false)
    }
  
    loadKycStatus()
  }, [session, router, supaClient])
 
  // 2️⃣ load face-api models with CDN approach
  useEffect(() => {
    const loadFaceApi = async () => {
      try {
        console.log('🤖 Loading face-api.js from CDN...')
        
        if (typeof window !== 'undefined' && (window as any).faceapi) {
          console.log('📦 Face-api.js already loaded')
          setFaceapi((window as any).faceapi)
          await loadModels()
          return
        }
        
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js'
          script.onload = () => {
            console.log('📦 Face-api.js CDN loaded successfully')
            if ((window as any).faceapi) {
              setFaceapi((window as any).faceapi)
              resolve(true)
            } else {
              reject(new Error('face-api.js not found after loading'))
            }
          }
          script.onerror = () => reject(new Error('Failed to load face-api.js from CDN'))
          document.head.appendChild(script)
        })
        
        await loadModels()
        
      } catch (err: any) {
        console.error('❌ Failed to load face-api.js:', err)
        setErrorMsg(`Failed to load face detection: ${err.message}. Please refresh the page and try again.`)
      }
    }

    const loadModels = async () => {
      if (!(window as any).faceapi) {
        throw new Error('face-api.js not available')
      }
      
      const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models'
      console.log('📍 Model URL:', MODEL_URL)
      
      await Promise.all([
        (window as any).faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        (window as any).faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        (window as any).faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ])
      
      console.log('✅ All face-api.js models loaded successfully!')
      setModelsLoaded(true)
    }

    if (typeof window !== 'undefined') {
      loadFaceApi()
    }
  }, [])

  // 3️⃣ init camera on Step 2
  useEffect(() => {
    if (step === 2) {
      initCamera()
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        setStream(null)
      }
    }
  }, [step])

  const isSecureContext = () => {
    return window.location.protocol === 'https:' || window.location.hostname === 'localhost'
  }

  const initCamera = async () => {
    setErrorMsg(null)
    setCameraPermission('unknown')

    try {
      if (!isSecureContext()) {
        throw new Error('Camera access requires HTTPS. Please use a secure connection.')
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraPermission('unavailable')
        throw new Error('Camera access is not supported in this browser.')
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      })
      
      setStream(mediaStream)
      setCameraPermission('granted')

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }

    } catch (err: any) {
      console.error('❌ Camera access error:', err)
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraPermission('denied')
        setErrorMsg('Camera permission denied. Please allow camera access and try again.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraPermission('unavailable')
        setErrorMsg('No camera found. Please make sure your camera is connected and try again.')
      } else if (err.name === 'NotSupportedError') {
        setCameraPermission('unavailable')
        setErrorMsg('Camera is not supported in this browser.')
      } else if (err.name === 'NotReadableError') {
        setCameraPermission('denied')
        setErrorMsg('Camera is already in use by another application. Please close other camera apps and try again.')
      } else if (err.message.includes('HTTPS')) {
        setCameraPermission('unavailable')
        setErrorMsg(err.message)
      } else {
        setCameraPermission('denied')
        setErrorMsg(`Camera access failed: ${err.message}`)
      }
    }
  }

  const retryCamera = () => {
    initCamera()
  }

  async function uploadFile(file: File, folder: string): Promise<string> {
    const { data: { user }, error } = await supaClient.auth.getUser()
    if (error || !user) throw new Error('Not authenticated')
    const path = `${folder}/${user.id}_${Date.now()}_${file.name}`
    const { error: upErr } = await supaClient
      .storage.from(KYC_BUCKET)
      .upload(path, file, { upsert: true })
    if (upErr) throw upErr
    const { data: urlData } = await supaClient
      .storage.from(KYC_BUCKET)
      .getPublicUrl(path)
    return urlData.publicUrl
  }

  const handleScanFace = async () => {
    setErrorMsg(null)
    setScanning(true)
    try {
      if (!modelsLoaded || !faceapi) throw new Error('Face detection not ready')
      
      const det = await faceapi
        .detectSingleFace(videoRef.current!, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks(true)
        .withFaceDescriptor()
      if (!det) throw new Error('No face detected. Please ensure good lighting and look directly at the camera.')

      const desc = Array.from(det.descriptor) as number[]
      setFaceDescriptor(desc)

      const video = videoRef.current!
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')!.drawImage(video, 0, 0)
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'))
      if (blob) {
        const file = new File([blob], `face_${session!.user.id}_${Date.now()}.png`, { type: 'image/png' })
        const url = await uploadFile(file, 'face')
        setFaceImageUrl(url)
      }

      setStep(3)
    } catch (e: any) {
      setErrorMsg(e.message)
    } finally {
      setScanning(false)
    }
  }

  const handleSubmit = async () => {
    setErrorMsg(null)
    if (!docType || !frontFile || !backFile || !addrFile || !faceDescriptor || !faceImageUrl) {
      return setErrorMsg('Please complete all steps before submitting.')
    }
    const { data: { user }, error: uErr } = await supaClient.auth.getUser()
    if (uErr || !user) return setErrorMsg('Not authenticated')
  
    try {
      const [frontUrl, backUrl, addressUrl] = await Promise.all([
        uploadFile(frontFile, 'front'),
        uploadFile(backFile, 'back'),
        uploadFile(addrFile, 'address'),
      ])
  
      const { error: subErr } = await supaClient
        .from('user_kyc_submissions')
        .insert([{
          user_id: user.id,
          doc_type: docType,
          front_url: frontUrl,
          back_url: backUrl,
          address_url: addressUrl,
          face_image_url: faceImageUrl,
          kyc_status: 'pending',
        }])
      if (subErr) throw subErr
  
      await supaClient
        .from('face_encodings')
        .insert([{
          user_id: user.id,
          descriptor: faceDescriptor,
          image_url: faceImageUrl,
        }])
  
      await supaClient
        .from('user_profile')
        .update({ kyc_status: 'pending' })
        .eq('uid', user.id)
  
      setStep(4)
    } catch (e: any) {
      console.error(e)
      setErrorMsg('Submission failed: ' + e.message)
    }
  }

  const handleReapply = () => {
    setErrorMsg(null)
    setDocType('')
    setFrontFile(null)
    setBackFile(null)
    setAddrFile(null)
    setFaceDescriptor(null)
    setFaceImageUrl(null)
    setStep(1)
  }

  const getDocTypeIcon = (type: string) => {
    switch (type) {
      case 'passport': return '🛂'
      case 'id_card': return '🆔'
      case 'driver_license': return '🚗'
      default: return '📄'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
        />
        <span className="ml-3 text-gray-600">Loading verification status...</span>
      </div>
    )
  }

  // Status Pages
  if (step === 4) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50/30 flex items-center justify-center p-4">
        <motion.div {...fadeInUp}>
          <Card className="border-0 shadow-2xl max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="h-10 w-10 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification In Progress</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Your KYC documents are being reviewed by our verification team. This process typically takes 24-48 hours.
              </p>
              <div className="bg-yellow-50 p-4 rounded-lg mb-6 text-left">
                <h3 className="font-semibold text-yellow-900 mb-2">What happens next?</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Our team will verify your submitted documents</li>
                  <li>• You'll receive an email notification once reviewed</li>
                  <li>• Your account will be activated upon approval</li>
                </ul>
              </div>
              <Button onClick={() => router.push('/user/dashboard')} className="w-full">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (step === 5) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50/30 flex items-center justify-center p-4">
        <motion.div {...fadeInUp}>
          <Card className="border-0 shadow-2xl max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <X className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-red-600 mb-4">Verification Rejected</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Unfortunately, your KYC submission was not approved. Please review the requirements and submit again.
              </p>
              <div className="bg-red-50 p-4 rounded-lg mb-6 text-left">
                <h3 className="font-semibold text-red-900 mb-2">Common rejection reasons:</h3>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• Documents are not clear or readable</li>
                  <li>• Information doesn't match across documents</li>
                  <li>• Documents are expired or invalid</li>
                  <li>• Photos are blurry or incomplete</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleReapply} className="flex-1 bg-red-600 hover:bg-red-700">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={() => router.push('/user/dashboard')} variant="outline">
                  Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

    if (step === 6) {
         return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50/30 flex items-center justify-center p-4">
        <motion.div {...fadeInUp}>
          <Card className="border-0 shadow-2xl max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-4">Verification Approved!</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Congratulations! Your identity has been successfully verified. You can now access all platform features.
              </p>
              <div className="bg-green-50 p-4 rounded-lg mb-6 text-left">
                <h3 className="font-semibold text-green-900 mb-2">✅ Now you can:</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Make deposits and withdrawals</li>
                  <li>• Access higher transaction limits</li>
                  <li>• Use all trading features</li>
                  <li>• Enjoy enhanced security protection</li>
                </ul>
              </div>
              <Button onClick={() => router.push('/user/dashboard')} className="w-full bg-green-600 hover:bg-green-700">
                <Zap className="h-4 w-4 mr-2" />
                Start Trading
              </Button>
            </CardContent>
          </Card>
             </motion.div>
          </div>
         )
       }

  // Main KYC Flow
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50/30">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Identity Verification
              </h1>
              <p className="text-gray-600 mt-1">Complete KYC to unlock full platform access</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        <Card className="border-0 shadow-md mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {steps.map((stepInfo, index) => (
                <div key={stepInfo.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                    index + 1 <= step 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    <stepInfo.icon className="h-5 w-5" />
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${
                      index + 1 <= step ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      Step {stepInfo.number}
                    </p>
                    <p className={`text-xs ${
                      index + 1 <= step ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {stepInfo.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`hidden sm:block w-16 h-0.5 ml-6 ${
                      index + 1 < step ? 'bg-blue-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {errorMsg && (
      <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: Document Upload */}
          {step === 1 && (
            <motion.div key="step1" {...fadeInUp}>
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Upload Identity Documents
                  </CardTitle>
                  <CardDescription>
                    Please upload clear photos of your government-issued ID
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Document Type
                    </label>
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select document type...</option>
                      <option value="passport">🛂 Passport</option>
                      <option value="id_card">🆔 National ID Card</option>
                      <option value="driver_license">🚗 Driver's License</option>
                </select>
                  </div>

                  {docType && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="grid gap-6 md:grid-cols-2"
                    >
                      {['front', 'back'].map(side => {
                  const file = side === 'front' ? frontFile : backFile
                  const setter = side === 'front' ? setFrontFile : setBackFile
                        const label = `${side === 'front' ? 'Front' : 'Back'} of ${docType}`

                  return (
                    <div key={side}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {label}
                            </label>
                            <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 transition-colors cursor-pointer group">
                        <input
                          type="file"
                          accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={e => setter(e.target.files?.[0] || null)}
                        />
                              {file ? (
                                <div className="text-center">
                                  <img 
                                    src={URL.createObjectURL(file)} 
                                    alt={label} 
                                    className="h-32 w-full object-contain rounded-lg mb-2"
                                  />
                                  <p className="text-sm text-green-600 font-medium">{file.name}</p>
                                  <p className="text-xs text-gray-500">Click to change</p>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3 group-hover:text-blue-500 transition-colors" />
                                  <p className="text-gray-600 font-medium">Upload {side} side</p>
                                  <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                                </div>
                              )}
                            </div>
                    </div>
                  )
                })}
                    </motion.div>
                  )}

                  {docType && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">📝 Document Requirements</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Ensure all text is clearly readable</li>
                        <li>• No glare or shadows on the document</li>
                        <li>• All four corners should be visible</li>
                        <li>• Document should not be expired</li>
                      </ul>
              </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* STEP 2: Face Verification */}
          {step === 2 && (
            <motion.div key="step2" {...fadeInUp}>
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-blue-600" />
                    Live Face Verification
                  </CardTitle>
                  <CardDescription>
                    Position your face in the camera for biometric verification
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
              {/* Camera Status */}
              {cameraPermission === 'unknown' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-blue-800">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"
                        />
                        <span>Requesting camera access...</span>
                      </div>
                </div>
              )}
              
              {cameraPermission === 'unavailable' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-yellow-800 mb-2">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">Camera Not Available</span>
                      </div>
                      <p className="text-yellow-700 text-sm mb-3">No camera was detected on this device.</p>
                      <div className="text-sm text-yellow-700">
                        <p><strong>Troubleshooting:</strong></p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Connect a camera to your device</li>
                          <li>Make sure camera drivers are installed</li>
                          <li>Try using Chrome, Firefox, or Safari</li>
                          <li>Refresh the page after connecting camera</li>
                    </ul>
                  </div>
                </div>
              )}
              
              {cameraPermission === 'denied' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-red-800 mb-2">
                        <X className="h-5 w-5" />
                        <span className="font-medium">Camera Access Required</span>
                      </div>
                      <p className="text-red-600 text-sm mb-3">We need camera access for identity verification.</p>
                      <div className="text-sm text-red-600">
                        <p><strong>To enable camera:</strong></p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Click the camera icon in your browser's address bar</li>
                      <li>Select "Allow" for camera permissions</li>
                          <li>Close other apps using your camera</li>
                          <li>Refresh if the issue persists</li>
                    </ul>
                  </div>
                </div>
              )}
              
              {/* Video Element */}
              <div className="relative">
                    <div className="relative bg-black rounded-xl overflow-hidden">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline
                        className="w-full h-80 object-cover" 
                  onLoadedMetadata={() => {
                    if (videoRef.current && cameraPermission === 'granted') {
                      videoRef.current.play().catch(console.error)
                    }
                  }}
                />
                
                {cameraPermission === 'granted' && (
                        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          Live
                  </div>
                )}
                
                {(cameraPermission === 'denied' || cameraPermission === 'unavailable') && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-center">
                            <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">{cameraPermission === 'unavailable' ? 'No camera available' : 'Camera access denied'}</p>
                    </div>
                  </div>
                )}

                      {/* Face detection overlay */}
                      {cameraPermission === 'granted' && (
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-blue-500 rounded-full opacity-30"></div>
                </div>
              )}
                    </div>
                  </div>
              
              {/* Action Buttons */}
                  <div className="flex gap-3">
                {(cameraPermission === 'denied' || cameraPermission === 'unavailable') && (
                      <Button
                    onClick={retryCamera}
                        variant="outline"
                        className="flex-1"
                  >
                        <RefreshCw className="h-4 w-4 mr-2" />
                    {cameraPermission === 'unavailable' ? 'Check Camera Again' : 'Retry Camera Access'}
                      </Button>
                )}
                
                    <Button
                  onClick={handleScanFace}
                  disabled={!modelsLoaded || scanning || cameraPermission !== 'granted' || !faceapi}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {!faceapi ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                          Loading Face Detection...
                        </>
                      ) : !modelsLoaded ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                          Loading AI Models...
                        </>
                      ) : scanning ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                          Scanning Face...
                        </>
                      ) : cameraPermission === 'unavailable' ? (
                        'Camera Required'
                      ) : cameraPermission === 'denied' ? (
                        'Camera Access Required'
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Scan Face
                        </>
                      )}
                    </Button>
              </div>
              
              {/* Instructions */}
              {cameraPermission === 'granted' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">📋 Instructions</h4>
                      <ul className="text-gray-600 text-sm space-y-1">
                        <li>• Position your face in the center of the camera</li>
                        <li>• Ensure good lighting on your face</li>
                    <li>• Look directly at the camera</li>
                        <li>• Remove sunglasses, hats, or masks</li>
                        <li>• Keep your face still during scanning</li>
                  </ul>
                </div>
              )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* STEP 3: Address Proof */}
          {step === 3 && (
            <motion.div key="step3" {...fadeInUp}>
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-blue-600" />
                    Proof of Address
                  </CardTitle>
                  <CardDescription>
                    Upload a recent utility bill or bank statement showing your address
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-400 transition-colors cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={e => setAddrFile(e.target.files?.[0] || null)}
                />
                    {addrFile ? (
                      <div className="text-center">
                        <img 
                          src={URL.createObjectURL(addrFile)} 
                          alt="Address proof" 
                          className="h-48 w-full object-contain rounded-lg mb-4"
                        />
                        <p className="text-lg text-green-600 font-medium">{addrFile.name}</p>
                        <p className="text-sm text-gray-500">Click to change file</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4 group-hover:text-blue-500 transition-colors" />
                        <p className="text-xl font-medium text-gray-900 mb-2">Upload Address Proof</p>
                        <p className="text-gray-500">PNG, JPG up to 10MB</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">📄 Accepted Documents</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Utility bill (electricity, gas, water)</li>
                      <li>• Bank statement</li>
                      <li>• Government-issued document with address</li>
                      <li>• Document must be dated within last 3 months</li>
                    </ul>
                  </div>

                  <Button
                onClick={handleSubmit}
                disabled={!addrFile}
                    className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                  >
                    <Shield className="h-5 w-5 mr-2" />
                    Submit KYC Verification
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        {step >= 1 && step <= 3 && (
          <div className="flex justify-between mt-8">
            <Button
              onClick={() => setStep((s) => (s - 1) as Step)}
              disabled={step === 1}
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
          {step < 3 && (
              <Button
              onClick={() => setStep((s) => (s + 1) as Step)}
              disabled={
                (step === 1 && (!docType || !frontFile || !backFile)) ||
                  (step === 2 && !faceDescriptor)
              }
                className="bg-blue-600 hover:bg-blue-700"
            >
              Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
          )}
        </div>
    </div>
  )
}
