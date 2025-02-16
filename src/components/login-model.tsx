"use client";

import { useAuthStore } from "@/providers/auth-store-provider";
import {
  HTMLAttributes,
  InputHTMLAttributes,
  PropsWithChildren,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  FormProvider,
  useController,
  UseControllerProps,
  useForm,
  useFormContext,
} from "react-hook-form";
export const LoginModel = () => {
  const user = useAuthStore((state) => state.user);
  const isLogin = user !== null;

  const className = `fixed inset-0 bg-gray-600/90 flex items-center justify-center text-stone-900 transition-all duration-500 ${
    isLogin ? "fade-out" : "fade-in"
  }`;

  return (
    <AnimatePresence isVisible={!isLogin}>
      <div className={className}>
        <LoginForm />
      </div>
    </AnimatePresence>
  );
};

type AnimatePresenceProps = PropsWithChildren<{
  isVisible: boolean;
}>;

const AnimatePresence = ({ isVisible, children }: AnimatePresenceProps) => {
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true); // 當 isVisible = true，直接顯示
    } else {
      setTimeout(() => setShouldRender(false), 500); // 延遲 500ms 才移除
    }
  }, [isVisible]);

  return shouldRender ? children : null;
};

type LoginFormField = {
  email: string;
  password: string;
};
const LoginForm = () => {
  const loginHandler = useAuthStore((state) => state.login);
  const useFormReturn = useForm<LoginFormField>();
  const { register, setError } = useFormReturn;

  const handleSubmit = useFormReturn.handleSubmit(async (data) => {
    const user = await loginHandler(data);

    if (user === null) {
      const message = "帳號或密碼錯誤";
      setError("email", { message });
      setError("password", { message });
      return;
    }
  });

  return (
    <FormProvider {...useFormReturn}>
      <div className="bg-white p-8 rounded-lg w-96">
        <h2 className="text-2xl font-bold mb-6">登入</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <InputGroup
            label="電子郵件"
            id="email"
            type="email"
            placeholder="請輸入電子郵件"
            rules={{ required: "電子郵件不可為空" }}
          />
          <InputGroup
            label="密碼"
            id="password"
            type="password"
            placeholder="請輸入密碼"
            rules={{ required: "密碼不可為空" }}
          />
          <FormError />
          <SubmitButton />
        </form>
      </div>
    </FormProvider>
  );
};

type InputGroupProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;

  id: keyof LoginFormField;
} & Pick<UseControllerProps<LoginFormField>, "rules">;

const InputGroup = (props: InputGroupProps) => {
  const { label, id, rules, className: inputClass, ...inputProps } = props;
  const { control } = useFormContext<LoginFormField>();
  const { fieldState, field } = useController({ name: id, control, rules });
  const { ref, onChange } = field;

  const inputClassName = `w-full p-2 border rounded ${inputClass || ""} ${
    fieldState.error ? "border-red-500" : ""
  } `;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`${fieldState.error ? "text-red-500 " : ""}`}>
      <label htmlFor={id} className="block mb-1 font-bold text-sm">
        {label}
      </label>
      <input
        id={id}
        className={inputClassName}
        {...inputProps}
        onChange={handleChange}
      />
    </div>
  );
};

const FormError = () => {
  const { formState } = useFormContext<LoginFormField>();
  const { errors } = formState;
  const message =
    errors.root?.message || errors.email?.message || errors.password?.message;

  return (
    <div
      className={`text-red-500 text-sm mb-0 transition-all ${
        message ? "h-6" : "h-0"
      }`}
    >
      {message}
    </div>
  );
};

const SubmitButton = () => {
  const { formState } = useFormContext<LoginFormField>();
  const { isSubmitting } = formState;
  return (
    <button
      type="submit"
      className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
    >
      {isSubmitting && (
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      <span>登入</span>
    </button>
  );
};
