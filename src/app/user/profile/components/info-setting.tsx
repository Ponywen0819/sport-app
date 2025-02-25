import { ChangeEventHandler, useEffect, useId, useState } from "react";
import {
  FormProvider,
  useController,
  useForm,
  useFormContext,
  UseFormProps,
} from "react-hook-form";

type Field = {
  name: string;
  sex: string;
};

const defaultValues: Field = {
  name: "",
  sex: "male",
};

const useFormProps: UseFormProps<Field> = {
  defaultValues,
};

export const InfoSetting = () => {
  const useFormReturn = useForm<Field>(useFormProps);

  const handleSubmit = useFormReturn.handleSubmit((data) => {
    console.log(data);
  });

  return (
    <FormProvider {...useFormReturn}>
      <form onSubmit={handleSubmit}>
        <NameInput />
        <SexRadio />
      </form>
    </FormProvider>
  );
};

const NameInput = () => {
  const { control } = useFormContext<Field>();
  const { field } = useController({ name: "name", control });
  const { value, onChange, onBlur } = field;

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="mb-6">
      <label className="block text-xs font-medium ">名稱</label>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder="請輸入名稱"
        className="w-full  px-0.5 py-2 border-b text-sm focus:outline-none focus:border-b-2 focus:border-blue-500"
      />
    </div>
  );
};

const SexRadio = () => {
  const { control } = useFormContext<Field>();
  const { field } = useController({ name: "sex", control });
  const { value, onChange } = field;
  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    onChange(e);
  };

  return (
    <div className="mb-6">
      <label className="block text-xs font-medium ">性別</label>
      <div className="flex gap-4 py-2">
        <RadioInput label="男性" value="male" />
        <RadioInput label="女性" value="female" />
      </div>
    </div>
  );
};

type RadioInputProps = {
  value: string;
  label: string;
};

const RadioInput = (props: RadioInputProps) => {
  const id = useId();
  const { label, value: optionValue } = props;
  const { control } = useFormContext<Field>();
  const { field } = useController({ name: "sex", control });
  const { value, onChange } = field;

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    onChange(e.target.value);
  };

  const checked = value === optionValue;

  const inputClassName = `
    w-3 h-3 text-stone-900 bg-gray-100  border-1 border-gray-300 appearance-none relative rounded-full shadow-lg transition
    checked:bg-slate-900 checked:rounded-full 
    checked:before:content-[attr(before)] checked:before:rounded-full checked:before:absolute checked:before:top-1/2 checked:before:left-1/2 checked:before:-translate-x-1/2 checked:before:-translate-y-1/2 checked:before:w-1 checked:before:h-1 checked:before:bg-white checked:border-transparent
  `;

  return (
    <div className="flex items-center gap-2">
      <input
        type="radio"
        id={id}
        name={"sex"}
        value={optionValue}
        className={inputClassName}
        checked={checked}
        onChange={handleChange}
      />
      <label htmlFor={id} className="text-sm text-gray-700">
        {label}
      </label>
    </div>
  );
};
