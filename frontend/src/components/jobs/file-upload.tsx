"use client";

import { UploadCloud, File, X, Music, Video, FileText } from "lucide-react";
import { useCallback } from "react";
import { useDropzone, DropzoneOptions } from "react-dropzone";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  value?: File | null;
  onChange: (file: File | null) => void;
  accept?: DropzoneOptions["accept"];
  maxSize?: number; // in bytes
  label?: string;
  description?: string;
  compact?: boolean;
}

export const FileUpload = ({
  value,
  onChange,
  accept,
  maxSize = 50 * 1024 * 1024, // 50MB default
  label = "Upload File",
  description = "Drag & drop or click to upload",
  compact = false,
}: FileUploadProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onChange(acceptedFiles[0]);
      }
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept,
      maxSize,
      maxFiles: 1,
      multiple: false,
    });

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.match(/\.(mp4|mov|avi)$/i)) return <Video className="w-8 h-8 text-blue-500" />;
    if (fileName.match(/\.(mp3|wav|ogg)$/i)) return <Music className="w-8 h-8 text-purple-500" />;
    if (fileName.match(/\.(txt|lrc)$/i)) return <FileText className="w-8 h-8 text-orange-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  return (
    <div className="w-full space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group relative overflow-hidden",
          isDragActive
            ? "border-primary bg-primary/5 scale-[0.99]"
            : "border-muted-foreground/25 hover:border-primary hover:bg-muted/50",
          value ? "bg-muted/30 border-primary/50" : "",
          compact ? "p-4 h-32" : "p-10 h-64"
        )}
      >
        <input {...getInputProps()} />

        {value ? (
          <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-300 w-full z-10">
            <div className="p-3 bg-background rounded-full shadow-sm mb-3 ring-1 ring-muted">
              {getFileIcon(value.name)}
            </div>
            <p className="text-sm font-semibold text-foreground truncate max-w-[90%]">
              {value.name}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {(value.size / (1024 * 1024)).toFixed(2)} MB
            </p>

            <button
              onClick={removeFile}
              className="mt-4 px-4 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors flex items-center gap-1 group/btn"
            >
              <X className="w-3 h-3 group-hover/btn:scale-110 transition-transform" />
              Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center z-10">
            <div className={cn(
              "rounded-full bg-muted flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-200",
              compact ? "w-10 h-10" : "w-16 h-16"
            )}>
              <UploadCloud className={cn(
                "text-muted-foreground transition-colors group-hover:text-primary",
                compact ? "w-5 h-5" : "w-8 h-8"
              )} />
            </div>
            <div className="space-y-1">
              <p className={cn(
                "font-medium text-foreground",
                compact ? "text-sm" : "text-lg"
              )}>
                {label}
              </p>
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
        )}

        {/* Background Pattern */}
        {!value && (
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px]" />
        )}
      </div>

      {fileRejections.length > 0 && (
        <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
           <X className="w-3 h-3" />
          File rejected: {fileRejections[0].errors[0].message}
        </p>
      )}
    </div>
  );
};
