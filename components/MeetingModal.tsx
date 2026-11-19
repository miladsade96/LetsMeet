import { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MeetingModalProps {
  isOpen: boolean;
  isPending?: boolean;
  onClose: () => void;
  title: string;
  additionalClasses?: string;
  children?: ReactNode;
  handleClick?: () => void;
  buttonText?: string;
  image?: string;
  buttonIcon?: string;
}

export default function MeetingModal({
  isOpen,
  isPending,
  onClose,
  title,
  additionalClasses,
  children,
  handleClick,
  buttonText,
  image,
  buttonIcon,
}: MeetingModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isPending) onClose();
      }}
    >
      <DialogContent className="flex w-full flex-col max-w-[520px] gap-6 border-none bg-dark-1 px-6 py-9 text-white">
        <div className="flex flex-col gap-6">
          {image && (
            <div className="flex justify-center">
              <Image src={image} alt={image} width={72} height={72} />
            </div>
          )}
          <DialogTitle
            className={cn(
              "text-3xl font-bold leading-[42px]",
              additionalClasses,
            )}
          >
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Meeting options and invitation details
          </DialogDescription>
          {children}
          <Button
            className="bg-blue-1 focus-visible:ring-0 focus-visible:ring-offset-0"
            onClick={handleClick}
            disabled={isPending}
            aria-busy={isPending}
          >
            {buttonIcon && (
              <Image
                src={buttonIcon}
                alt="Button icon"
                width={13}
                height={13}
              />
            )}{" "}
            &nbsp;
            {isPending ? "Creating meeting…" : buttonText || "Schedule Meeting"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
