import { h, Properties } from "hastscript";
import { toCanvas, toBlob } from "html-to-image";
import { jsPDF as JSPDF } from "jspdf";
import type { Plugin } from "unified";
import { Node } from "unist";
import { visit } from "unist-util-visit";

import "./PDFExport.css";

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
  children?:
    | GrowiNode[]
    | {
        tagName?: string;
        type?: string;
        value?: string;
        url?: string;
        properties?: Properties;
        children?: GrowiNode[];
      }[];
  value?: string;
  title?: string;
  url?: string;
  addEventListener?: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) => void;
}

// blobファイルを読み込む
const readBlobAsDataURL = (blob: Blob) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const pdfExport = (
  Tag: React.FunctionComponent<any>
): React.FunctionComponent<any> => {
  return ({ children, ...props }) => {
    try {
      if (!props.className.split(" ").includes("pdf-export")) {
        return <a {...props}>{children}</a>;
      }
      const onClick = async (e: MouseEvent) => {
        e.preventDefault();
        const title = document.title.replace(/ - .*/, "");
        const element = document.querySelector(".wiki");
        if (!element) {
          return;
        }
        // blob形式に変換
        const blob = await toBlob(element as any as HTMLElement);
        if (!blob) {
          return;
        }
        const dataUrl = await readBlobAsDataURL(blob);
        // jsPDFのインスタンスを生成
        const pdf = new JSPDF({
          orientation: "p",
          unit: "px",
          format: "a4",
          compress: true,
        });
        const margin = 40; // 余白を40pxに設定
        const pdfWidth = pdf.internal.pageSize.getWidth() - margin * 2;
        const pdfHeight = pdf.internal.pageSize.getHeight() - margin * 2;
        const scale = pdfWidth / element.clientWidth;
        const scaledWidth = element.clientWidth * scale;
        const scaledHeight = element.clientHeight * scale;
        const computedStyle = window.getComputedStyle(document.body);
        const backgroundColor = computedStyle.backgroundColor.match(
          /rgb\(([0-9]{1,3}), ([0-9]{1,3}), ([0-9]{1,3})\)/
        );
        const pages = Math.ceil(scaledHeight / pdfHeight);
        for (let i = 0; i < pages; i++) {
          pdf.setPage(i + 1);
          if (
            backgroundColor &&
            backgroundColor[1] &&
            backgroundColor[2] &&
            backgroundColor[3]
          ) {
            pdf.setFillColor(
              parseInt(backgroundColor[1]),
              parseInt(backgroundColor[2]),
              parseInt(backgroundColor[3])
            );
          } else {
            pdf.setFillColor(255, 255, 255); // デフォルトは白背景
          }
          pdf.rect(
            0,
            0,
            pdf.internal.pageSize.getWidth(),
            pdf.internal.pageSize.getHeight(),
            "F"
          );
          pdf.addImage(
            dataUrl,
            "JPEG",
            margin,
            -pdfHeight * i + margin,
            scaledWidth,
            scaledHeight
          );
          pdf.addPage();
        }
        // Remove the last page
        pdf.deletePage(pdf.getNumberOfPages());
        pdf.save(`${title === "/" ? "Root" : title}.pdf`);
      };
      return (
        <a {...props} onClick={onClick}>
          {children}
        </a>
      );
    } catch (err) {
      // console.error(err);
    }
    // Return the original component if an error occurs
    return <a {...props}>{children}</a>;
  };
};

export const remarkPlugin: Plugin = () => {
  return (tree: Node) => {
    visit(tree, "leafDirective", (node: Node) => {
      const n = node as unknown as GrowiNode;
      if (n.name !== "pdf") return;
      const data = n.data || (n.data = {});
      // add float button to the right bottom
      data.hChildren = [
        {
          tagName: "div",
          type: "element",
          properties: { className: "pdf-export-float-button" },
          children: [
            {
              tagName: "a",
              type: "element",
              properties: {
                className:
                  "material-symbols-outlined me-1 grw-page-control-dropdown-icon pdf-export",
              },
              children: [{ type: "text", value: "cloud_download" }],
            },
          ],
        },
      ];
    });
  };
};
