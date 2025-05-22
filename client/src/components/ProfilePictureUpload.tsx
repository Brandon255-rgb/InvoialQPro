import React, { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, X, Check, AlertCircle, User } from "lucide-react";
import Cropper from "react-cropper";
import type { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";

interface ProfilePictureUploadProps {
  currentImageUrl: string | null;
  userId: string;
  onImageUpdate: (url: string) => Promise<void>;
}

export function ProfilePictureUpload({ currentImageUrl, userId, onImageUpdate }: ProfilePictureUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropperRef = useRef<ReactCropperElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, or GIF).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCrop = () => {
    if (!cropperRef.current?.cropper) return;
    const croppedDataUrl = cropperRef.current.cropper.getCroppedCanvas().toDataURL();
    setCroppedImage(croppedDataUrl);
    setShowCropper(false);
    handleUpload(croppedDataUrl);
  };

  const handleUpload = async (imageDataUrl: string) => {
    try {
      setIsUploading(true);

      // Convert base64 to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const fileExt = "jpg";
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(fileName, blob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(fileName);

      // Update profile
      await onImageUpdate(publicUrl);

      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been successfully updated.",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setCroppedImage(null);
      setImageToCrop(null);
    }
  };

  const handleRemove = async () => {
    try {
      setIsUploading(true);
      await onImageUpdate("");
      toast({
        title: "Profile picture removed",
        description: "Your profile picture has been removed.",
      });
    } catch (error) {
      console.error("Error removing image:", error);
      toast({
        title: "Remove failed",
        description: "Failed to remove profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (showCropper && imageToCrop) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="w-full max-w-2xl p-4 bg-background rounded-lg shadow-lg">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Crop your profile picture</h3>
            <p className="text-sm text-muted-foreground">
              Adjust the image to create the perfect profile picture
            </p>
          </div>
          <div className="aspect-square w-full max-h-[60vh] bg-black/20 rounded-lg overflow-hidden">
            <Cropper
              ref={cropperRef}
              src={imageToCrop}
              style={{ height: "100%", width: "100%" }}
              aspectRatio={1}
              guides={true}
              viewMode={1}
              autoCropArea={1}
              background={false}
              responsive={true}
              restore={false}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCropper(false);
                setImageToCrop(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCrop}>
              <Check className="w-4 h-4 mr-2" />
              Apply
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div
        className={`relative w-32 h-32 rounded-full overflow-hidden border-2 transition-all duration-200 ${
          isHovered ? "border-orange-500" : "border-transparent"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {currentImageUrl ? (
          <img
            src={currentImageUrl}
            alt="Profile picture"
            className="object-cover w-full h-full rounded-full"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <User className="w-12 h-12 text-muted-foreground" />
          </div>
        )}

        {/* Hover overlay */}
        <div
          className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Camera className="w-4 h-4 text-white" />
            </Button>
            {currentImageUrl && (
              <Button
                size="icon"
                variant="secondary"
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30"
                onClick={handleRemove}
                disabled={isUploading}
              >
                <X className="w-4 h-4 text-white" />
              </Button>
            )}
          </div>
        </div>

        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading}
      />

      {/* Upload status */}
      {isUploading && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-sm text-muted-foreground">
          Uploading...
        </div>
      )}
    </div>
  );
} 