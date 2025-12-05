"use client";

import { UploadCloud, File, X } from "lucide-react";
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
}

export const FileUpload = ({
  value,
  onChange,
  accept,
  maxSize = 50 * 1024 * 1024, // 50MB default
  label = "Upload File",
  description = "Drag & drop or click to upload",
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

  return (
    <div className="w-full space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors gap-4 h-52",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-primary hover:bg-gray-50/50",
          value && "border-green-500 bg-green-50/30"
        )}
      >
        <input {...getInputProps()} />

        {value ? (
          <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
            <div className="p-4 bg-green-100 rounded-full mb-2">
              <File className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
              {value.name}
            </p>
            <p className="text-xs text-gray-500">
              {(value.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            <button
              onClick={removeFile}
              className="mt-4 px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
            >
              Remove File
            </button>
          </div>
        ) : (
          <>
            <div className="p-4 bg-gray-100 rounded-full">
              <UploadCloud className="w-8 h-8 text-gray-500" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
          </>
        )}
      </div>

      {fileRejections.length > 0 && (
        <p className="text-xs text-red-500 mt-2">
          File rejected: {fileRejections[0].errors[0].message}
        </p>
      )}
    </div>
  );
};

