import { cn } from '../lib/utils';

interface LogoProps {
    className?: string;
    showText?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    url?: string;
}

export const Logo = ({ className, size = 'md', url }: LogoProps) => {
    const sizeClasses = {
        sm: { box: 'px-1.5 py-0.5 rounded-md', text: 'text-sm', lines: 'w-4 h-0.5', img: 'h-6' },
        md: { box: 'px-2 py-0.5 rounded-lg', text: 'text-lg', lines: 'w-6 h-0.5', img: 'h-8' },
        lg: { box: 'px-3 py-1 rounded-xl', text: 'text-2xl', lines: 'w-8 h-1', img: 'h-12' },
        xl: { box: 'px-4 py-1.5 rounded-2xl', text: 'text-4xl', lines: 'w-12 h-1.5', img: 'h-16' },
    };

    const currentSize = sizeClasses[size];

    if (url) {
        return (
            <div className={cn("flex items-center gap-2 select-none", className)}>
                <img 
                    src={url} 
                    alt="Logo" 
                    className={cn("object-contain rounded-lg", currentSize.img)}
                    onError={(e) => {
                        // Fallback logic could go here if needed
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
            </div>
        );
    }

    return (
        <div className={cn("flex items-center gap-2 select-none", className)}>
            <div className="flex items-center">
                {/* Speed Lines */}
                <div className="flex flex-col gap-0.5 mr-2">
                    <div className={cn("bg-[#67B1A1] opacity-40 rounded-full", currentSize.lines)} style={{ width: '60%' }} />
                    <div className={cn("bg-[#67B1A1] opacity-70 rounded-full", currentSize.lines)} />
                    <div className={cn("bg-[#67B1A1] opacity-20 rounded-full", currentSize.lines)} style={{ width: '40%' }} />
                </div>
                
                {/* "swift" Box */}
                <div className={cn("bg-[#0D2E33] border border-white/10 flex items-center justify-center shadow-lg", currentSize.box)}>
                    <span className={cn("text-white font-[950] tracking-tighter lowercase italic", currentSize.text)}>
                        swift
                    </span>
                </div>
            </div>
            
            {/* "Rev" Text */}
            <span className={cn("text-[#67B1A1] font-[950] italic tracking-tight", currentSize.text)}>
                Rev
            </span>
        </div>
    );
};

export default Logo;
