import { createContext, useContext, useState, type PropsWithChildren } from 'react';

const BoardParamsContext = createContext<any>(null);

export function BoardParamsProvider({ children }: PropsWithChildren) {
  const [params, setParams] = useState({});
  return (
    <BoardParamsContext.Provider value={{ params, setParams }}>
      {children}
    </BoardParamsContext.Provider>
  );
}

export const useBoardParams = () => useContext(BoardParamsContext);
