# React Confirm Hook

[![Node.js CI](https://github.com/DASPRiD/react-confirm-hook/actions/workflows/ci.yml/badge.svg)](https://github.com/DASPRiD/react-confirm-hook/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/DASPRiD/react-confirm-hook/branch/main/graph/badge.svg?token=8KAJCE8J88)](https://codecov.io/gh/DASPRiD/react-confirm-hook)

React Confirm Hook is a simple utility to easily manage confirm dialogs or similar components like toasts. It provides
full Typescript support and can be used with any React UI framework.

## Quick start

Install this package (make sure that you have React 16 or higher installed):

```shell
npm i react-confirm-hook
```

The confirm dialog will need a mount point, so wrap your application in the `ConfirmProvider`:

```typescript
import App from './App.tsx';
import {ConfirmProvider} from 'react-confirm-hook';

render(
    (
        <ConfirmProvider>
            <App/>
        </ConfirmProvider>
    ),
    document.getElementById('root'),
);
```

Make sure to place the `ConfirmProvider` at the right level. Depending on your UI framework, you might want to have it
inside a theme provider or similar.

Next you need to create a confirm dialog component. As an example, we are using Material UI here:

```typescript jsx
import {LoadingButton} from '@mui/lab';
import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from '@mui/material';
import {ReactNode} from 'react';
import {ConfirmProps} from 'react-confirm-hook';

type ConfirmDialogProps = ConfirmProps & {
    title : string;
    message : NonNullable<ReactNode>;
};

const ConfirmDialog = ({
    title,
    message,
    onConfirm,
    onCancel,
    isConfirming,
} : ConfirmDialogProps) : JSX.Element => (
    <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xs"
    >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
            <DialogContentText>
                {message}
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button
                autoFocus
                onClick={onCancel}
                disabled={confirming}
            >
                Cancel
            </Button>
            <LoadingButton
                onClick={onConfirm}
                color="primary"
                loading={isConfirming}
            >
                Okay
            </LoadingButton>
        </DialogActions>
    </Dialog>
);

export default ConfirmDialog;
```

Once you have your confirm dialog component, you can now use it directly in any other component:

```typescript jsx
import ConfirmDialog from './ConfirmDialog';

const Foobar = () : JSX.Element => {
    const confirm = useConfirm(ConfirmDialog);
    
    return (
        <button onClick={() => {
            confirm({
                title: 'Please confirm',
                message: 'Please confirm that you want to do something',
                onConfirm: () => {
                    console.log('Confirmed');
                }
            });
        }}>
            Do something
        </button>
    );
};
```

Your `onConfirm()` callback can either return `void` or `Promise<void>`. When a promise is returned, the `ConfirmDialog`
component will receive `isConfirming` set to true and will not be allowed to be closed until the promise is resolved or
rejected.

You can additionally provide an `onCancel()` callback which will be called when the user cancels the dialog in any way.
This callback will be fired once the dialog was closed.
