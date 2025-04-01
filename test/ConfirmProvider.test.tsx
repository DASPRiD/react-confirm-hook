import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import type { ConfirmOptions, ConfirmProps } from "../src";
import { ConfirmProvider, useConfirm } from "../src";

afterEach(() => {
    cleanup();
});

type ConfirmDialogProps = ConfirmProps & {
    message: string;
};

const ConfirmDialog = ({
    message,
    onConfirm,
    onCancel,
    isConfirming,
    open,
}: ConfirmDialogProps): ReactNode => {
    return (
        <div className={open ? "open" : "closed"} data-testid="confirmDialog">
            <p data-testid="message">{message}</p>
            <button type="button" data-testid="cancel" onClick={onCancel}>
                Cancel
            </button>
            <button type="button" data-testid="confirm" onClick={onConfirm}>
                Confirm{isConfirming && "…"}
            </button>
        </div>
    );
};

it("should throw error when outside a ConfirmProvider", () => {
    const TestComponent = () => {
        useConfirm(ConfirmDialog);
        return null;
    };

    vi.spyOn(console, "error").mockImplementation(() => {
        // No-op
    });
    expect(() => {
        render(<TestComponent />);
    }).toThrow(new Error("Component must be wrapped in a ConfirmProvider"));
});

const initDialogTest = (options: ConfirmOptions<ConfirmDialogProps>) => {
    const TestComponent = () => {
        const confirm = useConfirm(ConfirmDialog);

        return (
            <button
                type="button"
                data-testid="trigger"
                onClick={() => {
                    confirm(options);
                }}
            />
        );
    };

    act(() => {
        render(
            <ConfirmProvider>
                <TestComponent />
            </ConfirmProvider>,
        );
    });

    act(() => {
        fireEvent.click(screen.getByTestId("trigger"));
    });
};

it("should open a dialog on confirm", () => {
    initDialogTest({
        message: "test",
        onConfirm: () => {
            // No-op
        },
    });

    expect(screen.getByTestId("confirmDialog")).toHaveAttribute("class", "open");
    expect(screen.getByTestId("message")).toHaveTextContent("test");
    expect(screen.getByTestId("confirm")).toHaveTextContent("Confirm");
});

it("should set isConfirming to true while confirming", () => {
    let resolveConfirm: () => void;
    const confirmPromise = new Promise<void>((resolve) => {
        resolveConfirm = resolve;
    });

    initDialogTest({
        message: "test",
        onConfirm: async () => confirmPromise,
    });

    act(() => {
        fireEvent.click(screen.getByTestId("confirm"));
    });

    expect(screen.getByTestId("confirm")).toHaveTextContent("Confirm…");

    act(() => {
        resolveConfirm();
    });

    expect(screen.getByTestId("confirm")).toHaveTextContent("Confirm");
});

it("should close the dialog after confirm", async () => {
    initDialogTest({
        message: "test",
        onConfirm: () => {
            // No-op
        },
    });

    act(() => {
        fireEvent.click(screen.getByTestId("confirm"));
    });

    await waitFor(() => {
        expect(screen.getByTestId("confirmDialog")).toHaveAttribute("class", "closed");
    });
});

it("should close the dialog on cancel", () => {
    initDialogTest({
        message: "test",
        onConfirm: () => {
            // No-op
        },
    });

    act(() => {
        fireEvent.click(screen.getByTestId("cancel"));
    });

    expect(screen.getByTestId("confirmDialog")).toHaveAttribute("class", "closed");
});

it("should not allow cancel while confirming", () => {
    const confirmPromise = new Promise<void>(() => {
        // No-op
    });

    initDialogTest({
        message: "test",
        onConfirm: async () => confirmPromise,
    });

    act(() => {
        fireEvent.click(screen.getByTestId("confirm"));
    });

    act(() => {
        fireEvent.click(screen.getByTestId("cancel"));
    });

    expect(screen.getByTestId("confirmDialog")).toHaveAttribute("class", "open");
});

it("should trigger cancel event when available", () => {
    let canceled = false;

    initDialogTest({
        message: "test",
        onConfirm: () => {
            // No-op
        },
        onCancel: () => {
            canceled = true;
        },
    });

    act(() => {
        fireEvent.click(screen.getByTestId("cancel"));
    });

    expect(canceled).toBe(true);
});

it("should report uncaught errors", async () => {
    initDialogTest({
        message: "test",
        onConfirm: () => {
            throw new Error("test");
        },
    });

    vi.spyOn(console, "error").mockImplementation();

    act(() => {
        fireEvent.click(screen.getByTestId("confirm"));
    });

    await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith("Uncaught error: ", new Error("test"));
    });

    expect(screen.getByTestId("confirm")).toHaveTextContent("Confirm");
    expect(screen.getByTestId("confirmDialog")).toHaveAttribute("class", "open");
});
