import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export const VolumeIcon = (props: IconProps) => (
  <IconBase {...props}><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18 5a9 9 0 0 1 0 14"/></IconBase>
);

export const ImageIcon = (props: IconProps) => (
  <IconBase {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></IconBase>
);

export const FileIcon = (props: IconProps) => (
  <IconBase {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></IconBase>
);

export const MessageIcon = (props: IconProps) => (
  <IconBase {...props}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/><path d="M8 9h8M8 13h5"/></IconBase>
);

export const MicIcon = (props: IconProps) => (
  <IconBase {...props}><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8"/></IconBase>
);

export const StopIcon = (props: IconProps) => (
  <IconBase {...props}><rect x="6" y="6" width="12" height="12" rx="1"/></IconBase>
);

export const ArrowIcon = (props: IconProps) => (
  <IconBase {...props}><path d="M5 12h14M13 6l6 6-6 6"/></IconBase>
);

export const CheckIcon = (props: IconProps) => (
  <IconBase {...props}><path d="m5 12 4 4L19 6"/></IconBase>
);

export const SparkIcon = (props: IconProps) => (
  <IconBase {...props}><path d="m12 3-1.4 3.6L7 8l3.6 1.4L12 13l1.4-3.6L17 8l-3.6-1.4L12 3Z"/><path d="m5 14-.9 2.1L2 17l2.1.9L5 20l.9-2.1L8 17l-2.1-.9L5 14ZM19 13l-.7 1.3L17 15l1.3.7L19 17l.7-1.3L21 15l-1.3-.7L19 13Z"/></IconBase>
);
