import { useState, useEffect } from 'react';

export const useModalStyles = (ref: React.RefObject<HTMLDivElement>) => {
   const [styles, setStyles] = useState({
      position: 'absolute' as const,
      borderRadius: '20px',
      top: '0px',
      left: '0px',
   });

   useEffect(() => {
      const calculateStyles = () => {
         if (ref.current) {
            const { offsetWidth: modalWidth, offsetHeight: modalHeight } = ref.current;

            if (modalWidth > 0 && modalHeight > 0) {
               const windowWidth = window.innerWidth;
               const windowHeight = window.innerHeight;

               const top = (windowHeight - modalHeight) / 2;
               const left = (windowWidth - modalWidth) / 2;

               setStyles({
                  position: 'absolute' as const,
                  borderRadius: '20px',
                  top: `${top}px`,
                  left: `${left}px`,
               });
            }
         }
      };

      const handleMutation = () => {
         if (ref.current) {
            calculateStyles();
         }
      };

      const mutationObserver = new MutationObserver(handleMutation);

      if (ref.current) {
         calculateStyles();
      } else {
         const parentNode = document.body; // Adjust if you know the exact parent
         mutationObserver.observe(parentNode, { childList: true, subtree: true });
      }

      window.addEventListener('resize', calculateStyles);

      return () => {
         mutationObserver.disconnect();
         window.removeEventListener('resize', calculateStyles);
      };
   }, [ref]);

   return styles;
};