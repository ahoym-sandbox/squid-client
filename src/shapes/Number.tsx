interface NumberProps {
  number: number;
  flip?: boolean;
}

export const Number: React.FC<NumberProps> = ({ number, flip = false }) => {
  return <p className={`Number ${flip ? "number-flip" : ""}`}>{number}</p>;
};
