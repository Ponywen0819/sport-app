import { HTMLAttributes } from 'react';
import { IconType } from 'react-icons';

type IconButtonProps = {
    icon: IconType;
    onClick?: () => void;
    color?: string;
    size?: number | string;
} & HTMLAttributes<HTMLButtonElement>

export const IconButton = (props: IconButtonProps) => {
    const { icon: Icon, color, size, className, ...buttonProps } = props
    const finalClassName = `text-gray-500 hover:text-white hover:bg-gray-200 p-2 rounded-full transition-all duration-300 ${className || ""}`

    return (
        <button
            type='button'
            className={finalClassName}
            {...buttonProps}
        >
            <Icon size={size}/>
        </button>
    );
};