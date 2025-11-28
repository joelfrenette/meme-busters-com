"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, LinkIcon, Loader2, ImageIcon, FolderOpen, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { analyzeMeme } from "@/app/actions/analyze-meme"

export function UploadForm() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleAnalyze = async () => {
    if (!imagePreview && !urlInput) {
      toast({
        title: "No image provided",
        description: "Please upload an image or provide a URL",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)

    try {
      console.log("[v0] Starting analysis...")

      // Use the image data (base64) for analysis
      const imageData = imagePreview || urlInput

      const response = await analyzeMeme(imageData)

      if (!response.success) {
        // Handle error response
        let title = "Analysis failed"
        let description = response.message

        switch (response.category) {
          case "not_a_meme":
            title = "Not a Meme"
            description = response.message + (response.details ? `\n\n${response.details}` : "")
            break
          case "api_key_missing":
            title = "Service Not Configured"
            description =
              "The AI analysis service is not properly configured. Please contact the administrator to set up the API key."
            break
          case "api_error":
            title = "AI Service Error"
            description = response.message + (response.details ? ` ${response.details}` : "")
            break
          case "database_error":
            title = "Database Error"
            description = response.message + (response.details ? ` ${response.details}` : "")
            break
          case "network_error":
            title = "Connection Error"
            description =
              "Unable to connect to the analysis service. Please check your internet connection and try again."
            break
          case "invalid_image":
            title = "Invalid Image"
            description =
              "The image format is not supported or the file is corrupted. Please try uploading a different image (JPG, PNG, or GIF)."
            break
          default:
            title = "Analysis Failed"
            description = response.message || "An unexpected error occurred. Please try again."
        }

        toast({
          title,
          description,
          variant: "destructive",
        })
        setIsAnalyzing(false)
        return
      }

      const result = response.data
      console.log("[v0] Analysis result:", result)

      // Store the result in sessionStorage so the results page can access it
      sessionStorage.setItem(`analysis-${result.id}`, JSON.stringify(result))

      // Navigate to results page
      router.push(`/results/${result.id}`)
    } catch (error: any) {
      console.error("[v0] Analysis error:", error)

      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze the meme. Please try again.",
        variant: "destructive",
      })
      setIsAnalyzing(false)
    }
  }

  const handleUrlAnalyze = async () => {
    if (!urlInput) {
      toast({
        title: "No URL provided",
        description: "Please enter a valid image URL",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    setImagePreview(urlInput)

    try {
      console.log("[v0] Starting URL analysis...")

      const response = await analyzeMeme(urlInput)

      if (!response.success) {
        // Handle error response
        let title = "Analysis failed"
        let description = response.message

        switch (response.category) {
          case "not_a_meme":
            title = "Not a Meme"
            description = response.message + (response.details ? `\n\n${response.details}` : "")
            break
          case "api_key_missing":
            title = "Service Not Configured"
            description =
              "The AI analysis service is not properly configured. Please contact the administrator to set up the API key."
            break
          case "api_error":
            title = "AI Service Error"
            description = response.message + (response.details ? ` ${response.details}` : "")
            break
          case "database_error":
            title = "Database Error"
            description = response.message + (response.details ? ` ${response.details}` : "")
            break
          case "network_error":
            title = "Connection Error"
            description =
              "Unable to connect to the analysis service. Please check your internet connection and try again."
            break
          case "invalid_image":
            title = "Invalid Image"
            description =
              "The image URL is invalid or the image format is not supported. Please try a different URL or upload the image directly."
            break
          default:
            title = "Analysis Failed"
            description = response.message || "An unexpected error occurred. Please try again."
        }

        toast({
          title,
          description,
          variant: "destructive",
        })
        setIsAnalyzing(false)
        return
      }

      const result = response.data
      console.log("[v0] Analysis result:", result)

      // Store the result in sessionStorage
      sessionStorage.setItem(`analysis-${result.id}`, JSON.stringify(result))

      // Navigate to results page
      router.push(`/results/${result.id}`)
    } catch (error: any) {
      console.error("[v0] Analysis error:", error)

      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze the meme. Please try again.",
        variant: "destructive",
      })
      setIsAnalyzing(false)
    }
  }

  const handleMultipleFiles = (files: FileList) => {
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"))

    if (imageFiles.length === 0) {
      toast({
        title: "No valid images",
        description: "Please select image files",
        variant: "destructive",
      })
      return
    }

    setSelectedFiles(imageFiles)
  }

  const handleFolderInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMultipleFiles(e.target.files)
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleBulkAnalyze = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select images to analyze",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    setUploadProgress({ current: 0, total: selectedFiles.length })

    const results = []
    const failures: Array<{ file: string; error: string }> = []

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        setUploadProgress({ current: i + 1, total: selectedFiles.length })

        try {
          // Convert file to base64
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.readAsDataURL(file)
          })

          const response = await analyzeMeme(base64)

          if (!response.success) {
            failures.push({
              file: file.name,
              error: response.message,
            })
            continue
          }

          const result = response.data
          results.push(result)

          // Store in sessionStorage
          sessionStorage.setItem(`analysis-${result.id}`, JSON.stringify(result))
        } catch (fileError: any) {
          console.error(`[v0] Failed to analyze ${file.name}:`, fileError)
          failures.push({
            file: file.name,
            error: fileError.message || "Unknown error",
          })
        }
      }

      if (results.length > 0) {
        toast({
          title: `Analysis complete`,
          description:
            failures.length > 0
              ? `Successfully analyzed ${results.length} meme${results.length > 1 ? "s" : ""}. ${failures.length} failed.`
              : `Successfully analyzed ${results.length} meme${results.length > 1 ? "s" : ""}`,
        })

        // Navigate to gallery to see all results
        router.push("/gallery")
      } else {
        // All failed
        toast({
          title: "All analyses failed",
          description: `Failed to analyze any memes. ${failures.length > 0 ? `First error: ${failures[0].error}` : ""}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Bulk analysis error:", error)
      toast({
        title: "Analysis failed",
        description: "An unexpected error occurred during bulk analysis. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
      setUploadProgress(null)
      setSelectedFiles([])
    }
  }

  return (
    <Card className="p-6">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload Image
          </TabsTrigger>
          <TabsTrigger value="folder">
            <FolderOpen className="h-4 w-4 mr-2" />
            Upload Folder
          </TabsTrigger>
          <TabsTrigger value="url">
            <LinkIcon className="h-4 w-4 mr-2" />
            Image URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            {imagePreview ? (
              <div className="space-y-4">
                <div className="relative w-full max-w-md mx-auto aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
                <Button variant="outline" onClick={() => setImagePreview(null)} disabled={isAnalyzing}>
                  Change Image
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium">Drop your meme here</p>
                  <p className="text-sm text-muted-foreground">or click to browse</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isAnalyzing}
                />
              </div>
            )}
          </div>

          {imagePreview && (
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full bg-[rgb(0,188,212)] hover:bg-[rgb(0,172,193)] text-white font-semibold text-lg"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Meme"
              )}
            </Button>
          )}
        </TabsContent>

        <TabsContent value="folder" className="space-y-6">
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <div className="space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <FolderOpen className="h-8 w-8 text-purple-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium">Select Multiple Images</p>
                  <p className="text-sm text-muted-foreground">Choose multiple meme images to analyze at once</p>
                </div>
                <div className="relative">
                  <Button variant="outline" disabled={isAnalyzing} asChild>
                    <label className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Select Files
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFolderInput}
                        className="hidden"
                        disabled={isAnalyzing}
                      />
                    </label>
                  </Button>
                </div>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{selectedFiles.length} file(s) selected</p>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFiles([])} disabled={isAnalyzing}>
                    Clear All
                  </Button>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-4">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <ImageIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => removeFile(index)}
                        disabled={isAnalyzing}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {uploadProgress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Analyzing memes...</span>
                      <span>
                        {uploadProgress.current} / {uploadProgress.total}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleBulkAnalyze}
                  disabled={isAnalyzing}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold text-lg"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing {uploadProgress?.current} of {uploadProgress?.total}...
                    </>
                  ) : (
                    `Analyze ${selectedFiles.length} Meme${selectedFiles.length > 1 ? "s" : ""}`
                  )}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="url" className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Image URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/meme.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={isAnalyzing}
              />
              <p className="text-sm text-muted-foreground">Paste a direct link to an image file</p>
            </div>

            {urlInput && (
              <div className="relative w-full max-w-md mx-auto aspect-video rounded-lg overflow-hidden bg-muted border">
                <img
                  src={urlInput || "/placeholder.svg"}
                  alt="URL Preview"
                  className="w-full h-full object-contain"
                  onError={() => {
                    toast({
                      title: "Invalid image URL",
                      description: "Could not load image from the provided URL",
                      variant: "destructive",
                    })
                  }}
                />
              </div>
            )}

            <Button
              onClick={handleUrlAnalyze}
              disabled={isAnalyzing || !urlInput}
              className="w-full bg-[rgb(0,188,212)] hover:bg-[rgb(0,172,193)] text-white font-semibold text-lg"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Meme"
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
