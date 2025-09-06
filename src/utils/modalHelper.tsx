import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  ReactNode,
  useRef,
  RefObject
} from "react";

import { createRoot, Root } from "react-dom/client";
import { Modal, Box } from "@mui/material";
import { useModalStyles } from "@/hooks/useModalStyles";

import { ThemeProvider } from "@emotion/react";
import { theme } from "@/theme";

export interface ModalHandle {
  open: () => void;
  close: () => void;
  set: (content: ReactNode | ((modal: ModalHandle) => ReactNode)) => void;
}

interface ModalWrapperProps {
  initial: ReactNode;
  onCloseCleanup: () => void;
}

const ModalWrapper = forwardRef<ModalHandle, ModalWrapperProps>(
  ({ initial, onCloseCleanup }, ref) => {
    const [open, setOpen] = useState(true);
    const [contents, setContents] = useState<ReactNode>(initial);

    const boxRef = useRef<HTMLDivElement>(null);
    const dynamicStyles = useModalStyles(boxRef as RefObject<HTMLDivElement>);

    /* Temporary modal object to inject into closures */
    const modalApi: ModalHandle = {
      open: () => setOpen(true),
      close: () => {
        setOpen(false);
        setTimeout(onCloseCleanup, 300);
      },
      set: (c) => {
        if (typeof c === "function") {
          setContents(c(modalApi));
        } else {
          setContents(c);
        }
      },
    };

    useImperativeHandle(ref, () => modalApi, []);

    return (
        <Modal
          open={open}
          onClose={() => {
            setOpen(false);
            setTimeout(onCloseCleanup, 300);
          }}
        >
          <div
            ref={boxRef}
            style={{
              ...dynamicStyles,
              backgroundColor: "white",
              borderRadius: 2,
              padding: 20,
            }}
          >
            {contents}
          </div>
        </Modal>
    );
  }
);
ModalWrapper.displayName = "ModalWrapper";

export function createModal(initial: ReactNode): Promise<ModalHandle> {
  return new Promise((resolve) => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const root: Root = createRoot(container);
    const ref = React.createRef<ModalHandle>();

    const cleanup = () => {
      root.unmount();
      container.remove();
    };

    const Wrapper = () => {
      React.useEffect(() => {
        if (ref.current) {
          resolve(ref.current);
        }
      }, []);
      return (
        <ThemeProvider theme={theme}>
          <ModalWrapper ref={ref} initial={initial} onCloseCleanup={cleanup} />
        </ThemeProvider>
      );
    };

    root.render(<Wrapper />);
  });
}
