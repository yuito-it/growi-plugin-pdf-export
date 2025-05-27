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

      const A4_WIDTH = 595;
      const A4_HEIGHT = 842;
      const PADDING = 40;
      const CONTENT_WIDTH = A4_WIDTH - PADDING * 2;

      // スケーリング倍率を計算
      const scale = CONTENT_WIDTH / element.clientWidth;

      // スクショを blob で取得
      const blob = await toBlob(element as HTMLElement, {
        width: element.clientWidth,
        height: element.clientHeight,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${element.clientWidth}px`,
          height: `${element.clientHeight}px`,
        },
      });

      if (!blob) return;

      const dataUrl = await readBlobAsDataURL(blob);

      // Image要素として読み込んでサイズを知る
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));

      const scaledImgWidth = CONTENT_WIDTH;
      const scaledImgHeight = (img.height / img.width) * scaledImgWidth;
      const PAGE_HEIGHT_AVAILABLE = A4_HEIGHT - PADDING * 2;

      const totalPages = Math.ceil(scaledImgHeight / PAGE_HEIGHT_AVAILABLE);

      // PDFインスタンス作成
      const pdf = new JSPDF({
        orientation: 'p',
        unit: 'px',
        format: [A4_WIDTH, A4_HEIGHT],
        compress: true,
      });

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();

        const yOffset = -i * PAGE_HEIGHT_AVAILABLE;

        pdf.addImage(
          img,
          'PNG',
          PADDING,
          yOffset + PADDING,
          scaledImgWidth,
          scaledImgHeight
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
