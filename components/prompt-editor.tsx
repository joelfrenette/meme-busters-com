"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Database,
  Sparkles,
  Search,
  History,
  Copy,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DEFAULT_PROMPT, DEFAULT_MEME_RECOGNITION_PROMPT } from "@/lib/default-prompt"

interface Prompt {
  id: string
  name: string
  version_name: string
  version_number: number
  description: string
  prompt_text: string
  is_active: boolean
  is_current: boolean
  updated_at: string
  created_at: string
}

export function PromptEditor() {
  const getDefaultPrompts = () => [
    {
      id: "default-recognition",
      name: DEFAULT_MEME_RECOGNITION_PROMPT.name,
      version_name: DEFAULT_MEME_RECOGNITION_PROMPT.version_name,
      version_number: 1,
      description: DEFAULT_MEME_RECOGNITION_PROMPT.description,
      prompt_text: DEFAULT_MEME_RECOGNITION_PROMPT.prompt_text,
      is_active: true,
      is_current: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "default-analysis",
      name: DEFAULT_PROMPT.name,
      version_name: DEFAULT_PROMPT.version_name,
      version_number: 1,
      description: DEFAULT_PROMPT.description,
      prompt_text: DEFAULT_PROMPT.prompt_text,
      is_active: true,
      is_current: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  const [prompts, setPrompts] = useState<Prompt[]>(getDefaultPrompts())
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(getDefaultPrompts()[0]) // Start with recognition prompt
  const [versions, setVersions] = useState<Prompt[]>([getDefaultPrompts()[0]])
  const [editedText, setEditedText] = useState(DEFAULT_MEME_RECOGNITION_PROMPT.prompt_text)
  const [editedDescription, setEditedDescription] = useState(DEFAULT_MEME_RECOGNITION_PROMPT.description)
  const [editedVersionName, setEditedVersionName] = useState(DEFAULT_MEME_RECOGNITION_PROMPT.version_name)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [needsInitialization, setNeedsInitialization] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [activeTab, setActiveTab] = useState("recognition")

  useEffect(() => {
    loadPrompts()
  }, [])

  const loadPrompts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/prompts")

      if (!response.ok) {
        console.warn("[v0] API failed, using default prompts")
        setNeedsInitialization(true)
        setMessage({ type: "error", text: "Using default prompts. Database not initialized." })
        setLoading(false)
        return
      }

      const data = await response.json()
      console.log("[v0] Loaded prompts from API:", data)

      setNeedsInitialization(data.needsInitialization || false)
      setPrompts(data.prompts)

      const promptName = activeTab === "recognition" ? "meme_recognition" : "meme_analysis"
      const currentPrompt = data.prompts.find((p: Prompt) => p.name === promptName && p.is_current)

      if (currentPrompt) {
        setSelectedPrompt(currentPrompt)
        setEditedText(currentPrompt.prompt_text)
        setEditedDescription(currentPrompt.description)
        setEditedVersionName(currentPrompt.version_name || "v1.0")

        const promptVersions = data.prompts.filter((p: Prompt) => p.name === promptName)
        setVersions(promptVersions)
      }
    } catch (error) {
      console.error("[v0] Error loading prompts:", error)
      setNeedsInitialization(true)
      setMessage({ type: "error", text: "Failed to load prompts. Using defaults." })
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (value: string) => {
    console.log("[v0] Tab changed to:", value)
    setActiveTab(value)
    const promptName = value === "recognition" ? "meme_recognition" : "meme_analysis"
    console.log("[v0] Looking for prompt:", promptName)
    console.log(
      "[v0] Available prompts:",
      prompts.map((p) => ({ name: p.name, version: p.version_name })),
    )

    let currentPrompt = prompts.find((p) => p.name === promptName && p.is_current)

    if (!currentPrompt) {
      console.log("[v0] Prompt not found in loaded prompts, using default")
      const defaultPrompts = getDefaultPrompts()
      currentPrompt = defaultPrompts.find((p) => p.name === promptName)
    }

    if (currentPrompt) {
      console.log("[v0] Loading prompt:", currentPrompt.version_name)
      setSelectedPrompt(currentPrompt)
      setEditedText(currentPrompt.prompt_text)
      setEditedDescription(currentPrompt.description)
      setEditedVersionName(currentPrompt.version_name || "v1.0")

      const promptVersions = prompts.filter((p) => p.name === promptName)
      setVersions(promptVersions.length > 0 ? promptVersions : [currentPrompt])
    } else {
      console.error("[v0] Could not find prompt for:", promptName)
    }
    setMessage(null)
  }

  const handleVersionChange = (versionName: string) => {
    const version = versions.find((v) => v.version_name === versionName)
    if (version) {
      setSelectedPrompt(version)
      setEditedText(version.prompt_text)
      setEditedDescription(version.description)
      setEditedVersionName(version.version_name)
    }
  }

  const initializeDatabase = async () => {
    try {
      setInitializing(true)
      setMessage(null)

      const response = await fetch("/api/admin/prompts", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.message || "Failed to initialize database. Please run the SQL script manually.",
        })
        return
      }

      setMessage({ type: "success", text: data.message || "Database initialized successfully!" })
      await loadPrompts()
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to initialize database. Please check the console for details.",
      })
      console.error("[v0] Initialization error:", error)
    } finally {
      setInitializing(false)
    }
  }

  const saveAsNewVersion = async () => {
    if (!selectedPrompt) return

    try {
      setSaving(true)
      setMessage(null)

      const response = await fetch("/api/admin/prompts/version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedPrompt.name,
          version_name: editedVersionName,
          prompt_text: editedText,
          description: editedDescription,
          parent_version_id: selectedPrompt.id,
        }),
      })

      if (!response.ok) throw new Error("Failed to save new version")

      setMessage({ type: "success", text: "New version saved successfully!" })
      await loadPrompts()
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save new version" })
    } finally {
      setSaving(false)
    }
  }

  const savePrompt = async () => {
    if (!selectedPrompt) return

    try {
      setSaving(true)
      setMessage(null)

      const response = await fetch("/api/admin/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedPrompt.id,
          prompt_text: editedText,
          description: editedDescription,
          version_name: editedVersionName,
        }),
      })

      if (!response.ok) throw new Error("Failed to save prompt")

      setMessage({ type: "success", text: "Prompt saved successfully!" })
      await loadPrompts()
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save prompt" })
    } finally {
      setSaving(false)
    }
  }

  const resetToOriginal = () => {
    if (selectedPrompt) {
      setEditedText(selectedPrompt.prompt_text)
      setEditedDescription(selectedPrompt.description)
      setEditedVersionName(selectedPrompt.version_name)
      setMessage(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  const renderPromptEditor = (promptType: string, color: string) => {
    const hasChanges =
      selectedPrompt &&
      (editedText !== selectedPrompt.prompt_text ||
        editedDescription !== selectedPrompt.description ||
        editedVersionName !== selectedPrompt.version_name)

    return (
      <div className="space-y-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {promptType === "recognition" && "Meme Recognition Prompt"}
                  {promptType === "analysis" && "Meme Analysis Prompt"}
                  {selectedPrompt?.is_current && (
                    <span className="text-xs bg-green-600 px-2 py-1 rounded">CURRENT</span>
                  )}
                </CardTitle>
                <CardDescription>
                  {promptType === "recognition" &&
                    "This prompt runs BEFORE analysis to detect if an image is actually a meme. Images with confidence below 50% are rejected."}
                  {promptType === "analysis" &&
                    "This prompt is used by the AI to analyze memes and determine their truthfulness, bias, and categorization"}
                </CardDescription>
              </div>
              {versions.length > 1 && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="version-select" className="text-sm text-gray-400">
                    Version:
                  </Label>
                  <Select value={selectedPrompt?.version_name} onValueChange={handleVersionChange}>
                    <SelectTrigger className="w-48 bg-gray-900 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {versions.map((v) => (
                        <SelectItem key={v.id} value={v.version_name}>
                          {v.version_name} {v.is_current && "★"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="version-name">Version Name</Label>
              <Input
                id="version-name"
                value={editedVersionName}
                onChange={(e) => setEditedVersionName(e.target.value)}
                className="bg-gray-900 border-gray-700"
                placeholder="e.g., Recognition.d.2025.01.25.v.02"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="bg-gray-900 border-gray-700"
                placeholder="Brief description of this prompt version"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt Text</Label>
              <Textarea
                id="prompt"
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="bg-gray-900 border-gray-700 min-h-[500px] font-mono text-sm"
                placeholder="Enter the AI prompt here..."
              />
              <p className="text-xs text-gray-400">
                Character count: {editedText.length} | Last updated:{" "}
                {selectedPrompt ? new Date(selectedPrompt.updated_at).toLocaleString() : "Never"}
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={savePrompt}
                disabled={saving || needsInitialization || !hasChanges}
                className={`bg-${color}-600 hover:bg-${color}-700`}
                style={{ backgroundColor: color === "cyan" ? "#0891b2" : color === "purple" ? "#9333ea" : "#0891b2" }}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Current Version
                  </>
                )}
              </Button>
              <Button
                onClick={saveAsNewVersion}
                disabled={saving || needsInitialization || !hasChanges}
                variant="outline"
              >
                <Copy className="mr-2 h-4 w-4" />
                Save as New Version
              </Button>
              <Button onClick={resetToOriginal} variant="outline" disabled={saving}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {versions.length > 1 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Version History
              </CardTitle>
              <CardDescription>Previous versions of this prompt</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className={`p-3 rounded border ${
                      v.id === selectedPrompt?.id ? "border-cyan-600 bg-cyan-900/20" : "border-gray-700 bg-gray-900"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold">{v.version_name}</span>
                        {v.is_current && <span className="ml-2 text-xs text-green-400">★ CURRENT</span>}
                        <p className="text-sm text-gray-400">{v.description}</p>
                        <p className="text-xs text-gray-500">Created: {new Date(v.created_at).toLocaleString()}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleVersionChange(v.version_name)}>
                        Load
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription className="whitespace-pre-wrap">{message.text}</AlertDescription>
        </Alert>
      )}

      {needsInitialization && (
        <Alert className="bg-amber-900/20 border-amber-600">
          <Database className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              The prompts database table hasn't been created yet. You're viewing the default prompts. Click "Initialize
              Database" to save prompts permanently.
            </span>
            <Button
              onClick={initializeDatabase}
              disabled={initializing}
              size="sm"
              className="ml-4 bg-amber-600 hover:bg-amber-700"
            >
              {initializing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Initialize Database
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="recognition" className="data-[state=active]:bg-purple-600">
            <Search className="mr-2 h-4 w-4" />
            Meme Recognition
          </TabsTrigger>
          <TabsTrigger value="analysis" className="data-[state=active]:bg-cyan-600">
            <Sparkles className="mr-2 h-4 w-4" />
            Meme Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recognition" className="mt-6">
          {renderPromptEditor("recognition", "purple")}
        </TabsContent>

        <TabsContent value="analysis" className="mt-6">
          {renderPromptEditor("analysis", "cyan")}
        </TabsContent>
      </Tabs>
    </div>
  )
}
