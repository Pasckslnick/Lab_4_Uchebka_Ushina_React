import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Счётчик: {count}</p>
      <button onClick={() => setCount(count + 1)}>Плюсик</button>
      <button onClick={() => setCount(count - 1)}>Минусик</button>
      <button onClick={() => setCount(0)}>Обнулить</button>
    </div>
  );
}
