import { toCanvas } from 'html-to-image';
import { jsPDF as JSPDF } from 'jspdf';

export const pdfExport = (Tag: React.FunctionComponent<any>): React.FunctionComponent<any> => {
  return ({ children, ...props }) => {
    if (!props.className?.split(' ').includes('pdf-export')) {
      return <a {...props}>{children}</a>;
    }

    const onClick = async (e: MouseEvent) => {
      e.preventDefault();

      const element = document.querySelector('.wiki');
      if (!element) return;

      // A4サイズ (ポイント換算)
      const A4_WIDTH = 595.28;
      const A4_HEIGHT = 841.89;
      const PADDING = 40;

      // canvas化（スケーリングなし・等倍）
      const canvas = await toCanvas(element as HTMLElement);
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // 画像をA4にフィットさせるためのスケーリング
      const scaledWidth = A4_WIDTH - PADDING * 2;
      const scale = scaledWidth / imgWidth;
      const scaledHeight = imgHeight * scale;

      const pageHeightAvailable = A4_HEIGHT - PADDING * 2;
      const totalPages = Math.ceil(scaledHeight / pageHeightAvailable);

      const pdf = new JSPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'a4',
      });

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();

        const offsetY = i * pageHeightAvailable;

        pdf.addImage(
          imgData,
          'PNG',
          PADDING, // ← 左余白
          PADDING - offsetY, // ← 上からズラして切り出し
          scaledWidth,
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
