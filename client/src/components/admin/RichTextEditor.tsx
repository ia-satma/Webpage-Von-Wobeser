import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";

// Contenido legado (guardado antes de este editor) es texto plano con la misma convención que
// `toParagraphs()`/`textToHtml()` del servidor: doble salto de línea = párrafo nuevo, salto
// simple = <br>. Si el valor no trae ninguna etiqueta HTML, se asume texto plano y se envuelve
// igual, para que se vea con los mismos saltos de párrafo la primera vez que se abre aquí.
function looksLikeHtml(text: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(text);
}

function plainTextToHtml(text: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  rows?: number;
  "data-testid"?: string;
}

/**
 * Editor con barra de herramientas (negrita, cursiva, listas) para los campos de texto largo
 * del panel — reemplaza los `<Textarea>` planos. Guarda HTML real (sanitizado en el servidor al
 * guardar, ver `server/mirror/sanitize.ts`), no el texto plano con saltos de línea de antes.
 */
export function RichTextEditor({ value, onChange, placeholder, rows = 6, "data-testid": testId }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Placeholder.configure({ placeholder: placeholder || "" }),
    ],
    content: value ? (looksLikeHtml(value) ? value : plainTextToHtml(value)) : "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none dark:prose-invert",
        style: `min-height: ${rows * 1.6}em`,
        ...(testId ? { "data-testid": testId } : {}),
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Sincroniza si `value` cambia desde fuera (ej. al cargar los datos de un formulario ya
  // montado, o al restaurar tras cancelar una edición) sin pelear con el cursor del usuario.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const incoming = value ? (looksLikeHtml(value) ? value : plainTextToHtml(value)) : "";
    if (incoming !== current && !editor.isFocused) {
      editor.commands.setContent(incoming);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="rounded-none border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      <div className="flex items-center gap-1 border-b border-input p-1">
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Negrita"
          data-testid={testId ? `${testId}-bold` : undefined}
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Cursiva"
          data-testid={testId ? `${testId}-italic` : undefined}
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <div className="mx-1 h-5 w-px bg-border" />
        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Lista con viñetas"
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
      </div>
      <EditorContent
        editor={editor}
        className="px-3 py-2 text-base md:text-sm [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none"
      />
    </div>
  );
}
