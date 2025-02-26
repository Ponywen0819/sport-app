import { InputHTMLAttributes } from "react";

type InputGroupProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export const InputGroup = (props: InputGroupProps) => {
  const { className, label, ...rest } = props;
  return (
    <div>
      {label && <label className="block text-xs font-medium">{label}</label>}
      <input
        {...rest}
        className={`w-full px-0.5 py-2 text-sm  border-b-2 focus:outline-none  focus:border-blue-500 ${className}`}
      />
    </div>
  );
};
