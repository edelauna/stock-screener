import { useContext } from "react";
import { navigationStore } from "../../context/navigation/navigation.provider";
import { renderHook, waitFor } from "@testing-library/react";
import { useObserver } from "./use-observer";
import { mockIntersectionObserver } from "../../setupTests";

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

describe('useObserver', () => {
  const mockNavigationDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useContext as jest.Mock).mockImplementation((context) => {
      if (context === navigationStore) {
        return { dispatch: mockNavigationDispatch };
      }
    });
  });

  test('adds new ref to refs state', async () => {
    const mockRef1 = { current: null };

    const { result } = renderHook(() => useObserver(mockRef1));

    expect(result.current).toBe(mockRef1);
    expect(mockNavigationDispatch).not.toHaveBeenCalled();
  });

  test('creates and uses IntersectionObserver with new refs', () => {
    const mockRef1 = { current: { id: 'element1' } };

    renderHook(() => useObserver(mockRef1));

    const {observe} = mockIntersectionObserver()
    expect(mockIntersectionObserver).toHaveBeenCalledWith(expect.any(Function), { threshold: 0.5 });
    expect(observe).toHaveBeenCalledWith(mockRef1.current);
  });

});
