"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileText, Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { parseAndImportCv } from "@/app/actions/cv";
import type { ParsedCvResult } from "@/lib/services/cv-parser-service";
import { toast } from "sonner";

interface CvUploadProps {
  onParsed: (data: ParsedCvResult) => void;
}

const ACCEPT = ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

export function CvUpload({ onParsed }: CvUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);

  const processFile = useCallback(async (selected: File) => {
    setFile(selected);
    setParsing(true);

    try {
      const formData = new FormData();
      formData.append("cv", selected);
      const result = await parseAndImportCv(formData);
      onParsed(result.parsed);
      toast.success("CV parsed! Your profile and master resume were updated.");
    } catch (err) {
      setFile(null);
      toast.error(err instanceof Error ? err.message : "Failed to parse CV");
    } finally {
      setParsing(false);
    }
  }, [onParsed]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) processFile(dropped);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) processFile(selected);
    e.target.value = "";
  }

  function clearFile() {
    setFile(null);
  }

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !parsing && inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center cursor-pointer",
          "transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
          dragging
            ? "border-primary bg-primary/5 shadow-[var(--shadow-glow)] scale-[1.01]"
            : "border-border/80 hover:border-primary/40 hover:bg-muted/30",
          parsing && "pointer-events-none opacity-70"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={handleFileChange}
          disabled={parsing}
        />

        {parsing ? (
          <>
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <div>
              <p className="font-medium">AI is parsing your CV…</p>
              <p className="text-sm text-muted-foreground mt-1">
                Extracting skills, experience, and building your master resume
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-medium">Drop your CV here or click to browse</p>
              <p className="text-sm text-muted-foreground mt-1">
                PDF, DOCX, or TXT · Max 5 MB
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI will parse and create your master resume
            </div>
          </>
        )}
      </div>

      {file && !parsing && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3">
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <span className="text-sm truncate flex-1">{file.name}</span>
          <Button type="button" variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={clearFile}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
