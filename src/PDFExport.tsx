import { h, Properties } from 'hastscript';
import { toCanvas, toBlob } from 'html-to-image';
import { jsPDF as JSPDF } from 'jspdf';
import type { Plugin } from 'unified';
import { Node } from 'unist';
import { visit } from 'unist-util-visit';

import './PDFExport.css';

interface GrowiNode extends Node {
  name?: string;
  hName?: string;
  tagName?: string;
  hProperties?: Properties;
  properties?: Properties;
  hChildren?: Node[] | GrowiNode[];
  data?: {
    hProperties?: Properties;
    hName?: string;
    hChildren?: Node[] | GrowiNode[];
    [key: string]: any;
  };
  type: string;
  attributes?: { [key: string]: string };
  children?: GrowiNode[] | {
    tagName?: string, type?: string, value?: string, url?: string, properties?: Properties, children?: GrowiNode[]
  }[];
  value?: string;
  title?: string;
  url?: string;
  addEventListener?: (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => void;
}

// BlobをData URLに変換
const readBlobAsDataURL = (blob: Blob) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const pdfExport = (Tag: React.FunctionComponent<any>): React.FunctionComponent<any> => {
  return ({ children, ...props }) => {
    try {
      if (!props.className?.split(' ').includes('pdf-export')) {
        return (<a {...props}>{children}</a>);
      }

      const onClick = async (e: MouseEvent) => {
        e.preventDefault();
        const title = document.title.replace(/ - .*/, '');
        const element = document.querySelector('.wiki');
        if (!element) return;

        const blob = await toBlob(element as HTMLElement);
        if (!blob) return;

        const dataUrl = await readBlobAsDataURL(blob);

        const pdf = new JSPDF({
          orientation: 'p',
          unit: 'px',
          format: 'a4',
          compress: true,
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const paddingX = 20;
        const paddingY = 30;
        const innerWidth = pdfWidth - paddingX * 2;
        const innerHeight = pdfHeight - paddingY * 2;

        const scale = innerWidth / element.clientWidth;
        const scaledWidth = element.clientWidth * scale;
        const scaledHeight = element.clientHeight * scale;

        const xOffset = paddingX + (innerWidth - scaledWidth) / 2;
        const pages = Math.ceil(scaledHeight / innerHeight);

        for (let i = 0; i < pages; i++) {
          if (i > 0) pdf.addPage();

          pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
          pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');

          const yOffset = paddingY - innerHeight * i;

          pdf.addImage(
            dataUrl,
            'JPEG',
            xOffset,
            yOffset,
            scaledWidth,
            scaledHeight
          );
        }
        pdf.save(`${title === '/' ? 'Root' : title}.pdf`);
      };

      return (
        <a {...props} onClick={onClick}>{children}</a>
      );
    } catch (err) {
      console.error('PDF export failed:', err);
    }

    return (<a {...props}>{children}</a>);
  };
};

export const remarkPlugin: Plugin = () => {
  return (tree: Node) => {
    visit(tree, 'leafDirective', (node: Node) => {
      const n = node as unknown as GrowiNode;
      if (n.name !== 'pdf') return;
      const data = n.data || (n.data = {});
      data.hChildren = [
        {
          tagName: 'div',
          type: 'element',
          properties: { className: 'pdf-export-float-button' },
          children: [
            {
              tagName: 'a',
              type: 'element',
              properties: { className: 'material-symbols-outlined me-1 grw-page-control-dropdown-icon pdf-export' },
              children: [{ type: 'text', value: 'cloud_download' }],
            },
          ],
        },
      ];
    });
  };
};
