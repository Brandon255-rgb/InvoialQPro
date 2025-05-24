import React from "react";
import { getInitials, getRandomColor } from "@/lib/utils";

interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg" | "xl";
  index?: number;
}

const sizesMap = {
  sm: {
    outer: "h-8 w-8",
    text: "text-xs",
  },
  md: {
    outer: "h-10 w-10",
    text: "text-sm",
  },
  lg: {
    outer: "h-12 w-12",
    text: "text-base",
  },
  xl: {
    outer: "h-16 w-16",
    text: "text-lg",
  },
};

const Avatar: React.FC<AvatarProps> = ({
  name,
  imageUrl,
  size = "md",
  index = 0,
}) => {
  const { outer, text } = sizesMap[size];
  const initials = getInitials(name);
  const colorClass = getRandomColor(index);

  if (imageUrl) {
    return (
      <div className={`${outer} rounded-full overflow-hidden flex-shrink-0 border border-gray-300`}>
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${outer} rounded-full flex-shrink-0 flex items-center justify-center ${colorClass}`}
    >
      <span className={`font-medium ${text}`}>{initials}</span>
    </div>
  );
};

export default Avatar;
