type ProgressBarProps = {
  rate: number;
};

const ProgressBar = (props: ProgressBarProps) => {
  const { rate } = props;
  const formattedRate = getFormattedRate(rate);

  return (
    <div className="relative pt-1 w-full">
      <div className="flex h-2 overflow-hidden text-xs bg-gray-200 rounded">
        <div
          style={{ width: `${formattedRate}%` }}
          className="flex flex-col text-center text-white bg-teal-500 transition-all duration-500 ease-in-out"
        />
      </div>
    </div>
  );
};

const checkRateIsValid = (rate: number) => {
  if (rate < 0 || rate > 100) {
    throw new Error("Invalid rate value");
  }

  return true;
};

const getFormattedRate = (rate: number) => {
  const isRateValid = checkRateIsValid(rate);
  if (!isRateValid) {
    return "0";
  }
  return `${rate.toFixed(2)}`;
};

export default ProgressBar;
