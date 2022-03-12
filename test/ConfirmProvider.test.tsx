import '@testing-library/jest-dom';
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import type {ConfirmOptions, ConfirmProps} from '../src';
import {ConfirmProvider, useConfirm} from '../src';

type ConfirmDialogProps = ConfirmProps & {
    message : string;
};

const ConfirmDialog = ({
    message,
    onConfirm,
    onCancel,
    isConfirming,
    open,
} : ConfirmDialogProps) : JSX.Element => {
    return (
        <div className={open ? 'open' : 'closed'} role="confirmDialog">
            <p role="message">{message}</p>
            <button role="cancel" onClick={onCancel}>Cancel</button>
            <button role="confirm" onClick={onConfirm}>Confirm{isConfirming && '…'}</button>
        </div>
    );
};

it('should throw error when outside a ConfirmProvider', () => {
    const TestComponent = () => {
        useConfirm(ConfirmDialog);
        return null;
    };

    jest.spyOn(console, 'error').mockImplementation(() => {
        // No-op
    });
    expect(
        () => {
            render(<TestComponent/>);
        }
    ).toThrow(
        new Error('Component must be wrapped in a ConfirmProvider')
    );
});

const initDialogTest = (options : ConfirmOptions<ConfirmDialogProps>) => {
    const TestComponent = () => {
        const confirm = useConfirm(ConfirmDialog);

        return (
            <button role="trigger" onClick={() => {
                confirm(options);
            }}/>
        );
    };

    act(() => {
        render(
            (
                <ConfirmProvider>
                    <TestComponent/>
                </ConfirmProvider>
            )
        );
    });

    act(() => {
        fireEvent.click(screen.getByRole('trigger'));
    });
};

it('should open a dialog on confirm', () => {
    initDialogTest({
        message: 'test',
        onConfirm: () => {
            // No-op
        },
    });

    expect(screen.getByRole('confirmDialog')).toHaveAttribute('class', 'open');
    expect(screen.getByRole('message')).toHaveTextContent('test');
    expect(screen.getByRole('confirm')).toHaveTextContent('Confirm');
});

it('should set isConfirming to true while confirming', () => {
    let resolveConfirm : () => void;
    const confirmPromise = new Promise<void>(resolve => {
        resolveConfirm = resolve;
    });

    initDialogTest({
        message: 'test',
        onConfirm: async () => confirmPromise,
    });

    act(() => {
        fireEvent.click(screen.getByRole('confirm'));
    });

    expect(screen.getByRole('confirm')).toHaveTextContent('Confirm…');

    act(() => {
        resolveConfirm();
    });

    expect(screen.getByRole('confirm')).toHaveTextContent('Confirm');
});

it('should close the dialog after confirm', async () => {
    initDialogTest({
        message: 'test',
        onConfirm: () => {
            // No-op
        },
    });

    act(() => {
        fireEvent.click(screen.getByRole('confirm'));
    });

    await waitFor(() => {
        expect(screen.getByRole('confirmDialog')).toHaveAttribute('class', 'closed');
    });
});

it('should close the dialog on cancel', () => {
    initDialogTest({
        message: 'test',
        onConfirm: () => {
            // No-op
        },
    });

    act(() => {
        fireEvent.click(screen.getByRole('cancel'));
    });

    expect(screen.getByRole('confirmDialog')).toHaveAttribute('class', 'closed');
});

it('should not allow cancel while confirming', () => {
    const confirmPromise = new Promise<void>(() => {
        // No-op
    });

    initDialogTest({
        message: 'test',
        onConfirm: async () => confirmPromise,
    });

    act(() => {
        fireEvent.click(screen.getByRole('confirm'));
    });

    act(() => {
        fireEvent.click(screen.getByRole('cancel'));
    });

    expect(screen.getByRole('confirmDialog')).toHaveAttribute('class', 'open');
});

it('should trigger cancel event when available', () => {
    let canceled = false;

    initDialogTest({
        message: 'test',
        onConfirm: () => {
            // No-op
        },
        onCancel: () => {
            canceled = true;
        },
    });

    act(() => {
        fireEvent.click(screen.getByRole('cancel'));
    });

    expect(canceled).toBe(true);
});

it('should report uncaught errors', async () => {
    initDialogTest({
        message: 'test',
        onConfirm: () => {
            throw new Error('test');
        },
    });

    jest.spyOn(console, 'error').mockImplementation();

    act(() => {
        fireEvent.click(screen.getByRole('confirm'));
    });

    await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Uncaught error: ', new Error('test'));
    });

    expect(screen.getByRole('confirm')).toHaveTextContent('Confirm');
    expect(screen.getByRole('confirmDialog')).toHaveAttribute('class', 'open');
});
