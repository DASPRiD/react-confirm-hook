import type {JSXElementConstructor, ReactNode} from 'react';
import {createContext, useCallback, useContext, useState} from 'react';

export type ConfirmProps = {
    open : boolean;
    onConfirm : () => void;
    onCancel : () => void;
    isConfirming : boolean;
};

export type ConfirmOptions<T extends ConfirmProps> = Omit<T, 'open' | 'onConfirm' | 'onCancel' | 'isConfirming'> & {
    onConfirm : () => Promise<void> | void;
    onCancel ?: () => void;
};

export type Confirm<T extends ConfirmProps> = (options : ConfirmOptions<T>) => void;

type ConfirmRequest<T extends ConfirmProps> = {
    Component : JSXElementConstructor<T>;
    options : ConfirmOptions<T>;
};

type RequestConfirm<T extends ConfirmProps> = (request : ConfirmRequest<T>) => void;

const confirmContext = createContext<RequestConfirm<ConfirmProps> | null>(null);

export const useConfirm = <T extends ConfirmProps>(ConfirmComponent : JSXElementConstructor<T>) : Confirm<T> => {
    const context = useContext(confirmContext) as RequestConfirm<T> | null;

    if (!context) {
        throw new Error('Component must be wrapped in a ConfirmProvider');
    }

    return useCallback((options : ConfirmOptions<T>) => {
        context({
            Component: ConfirmComponent,
            options,
        });
    }, [context, ConfirmComponent]);
};

type ConfirmProviderProps = {
    children ?: ReactNode | undefined;
};

const ConfirmProvider = ({children} : ConfirmProviderProps) : ReactNode => {
    const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest<ConfirmProps> | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [open, setOpen] = useState(false);

    const requestConfirm = useCallback((confirmRequest : ConfirmRequest<ConfirmProps>) => {
        setConfirmRequest(confirmRequest);
        setOpen(true);
    }, []);

    const handleCancel = useCallback(() => {
        if (isConfirming) {
            return;
        }

        setOpen(false);

        if (confirmRequest?.options.onCancel) {
            confirmRequest.options.onCancel();
        }
    }, [confirmRequest, isConfirming]);

    const handleConfirm = useCallback(() => {
        setIsConfirming(true);

        (async () => {
            try {
                if (confirmRequest) {
                    await confirmRequest.options.onConfirm();
                }
            } finally {
                setIsConfirming(false);
            }

            setOpen(false);
        })().catch(error => {
            console.error('Uncaught error: ', error);
        });
    }, [confirmRequest]);

    return (
        <confirmContext.Provider value={requestConfirm}>
            {children}

            {confirmRequest && (
                <confirmRequest.Component
                    {...confirmRequest.options}
                    open={open}
                    onCancel={handleCancel}
                    onConfirm={handleConfirm}
                    isConfirming={isConfirming}
                />
            )}
        </confirmContext.Provider>
    );
};

export default ConfirmProvider;
