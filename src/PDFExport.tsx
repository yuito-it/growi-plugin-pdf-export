import { toBlob } from 'html-to-image';
import { jsPDF as JSPDF } from 'jspdf';

const readBlobAsDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const pdfExport = (Tag: React.FunctionComponent<any>): React.FunctionComponent<any> => {
  return ({ children, ...props }) => {
    if (!props.className?.split(' ').includes('pdf-export')) {
      return <a {...props}>{children}</a>;
    }

    const onClick = async (e: MouseEvent) => {
      e.preventDefault();

      const element = document.querySelector('.wiki');
      if (!element) return;

      // 📏 A4サイズ（px）と余白
      const A4_WIDTH = 595.28;
      const A4_HEIGHT = 841.89;
      const PADDING = 40; // px

      const originalWidth = element.clientWidth;
      const originalHeight = element.clientHeight;

      const scale = (A4_WIDTH - PADDING * 2) / originalWidth;
      const scaledHeight = originalHeight * scale;

      // 📸 要素をスケーリングしてBlobに変換
      const blob = await toBlob(element as HTMLElement, {
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${originalWidth}px`,
          height: `${originalHeight}px`,
        },
      });

      if (!blob) return;

      const dataUrl = await readBlobAsDataURL(blob);

      const pdf = new JSPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'a4',
        compress: true,
      });

      const usableHeight = A4_HEIGHT - PADDING * 2;
      const totalPages = Math.ceil(scaledHeight / usableHeight);

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();

        const offsetY = -i * usableHeight;

        pdf.addImage(
          dataUrl,
          'PNG',
          PADDING, // ⬅ 左から余白
          offsetY + PADDING, // ⬇ 上から余白込みでずらす
          A4_WIDTH - PADDING * 2,
          scaledHeight
        );
      }

      const title = document.title.replace(/ - .*/, '') || 'document';
      pdf.save(`${title}.pdf`);
    };

    return (
      <a {...props} onClick={onClick}>
        {children}
      </a>
    );
  };
};
