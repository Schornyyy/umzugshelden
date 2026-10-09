"use client";

import {
  Editor,
  EditorState,
  RichUtils,
  convertFromRaw,
  convertToRaw,
  type DraftHandleValue,
} from "draft-js";
import { useRef, useState } from "react";
import "draft-js/dist/Draft.css";

type Props = {
  field: { onChange: (value: string) => void };
  defaultValue: string;
};

const BUTTON_CLASS =
  "rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100";

function createInitialState(value: string) {
  if (!value) return EditorState.createEmpty();
  try {
    return EditorState.createWithContent(convertFromRaw(JSON.parse(value)));
  } catch (error) {
    console.error("Rich-Text-Inhalt konnte nicht geladen werden", error);
    return EditorState.createEmpty();
  }
}

export function RichTextEditor({ field, defaultValue }: Props) {
  const [editorState, setEditorState] = useState(() => createInitialState(defaultValue));
  const editorRef = useRef<Editor>(null);

  const commit = (state: EditorState) => {
    setEditorState(state);
    field.onChange(JSON.stringify(convertToRaw(state.getCurrentContent())));
  };

  const handleKeyCommand = (command: string): DraftHandleValue => {
    const next = RichUtils.handleKeyCommand(editorState, command);
    if (!next) return "not-handled";
    commit(next);
    return "handled";
  };

  const toggleInlineStyle = (style: string) => {
    commit(RichUtils.toggleInlineStyle(editorState, style));
    editorRef.current?.focus();
  };

  const toggleBlockType = (blockType: string) => {
    commit(RichUtils.toggleBlockType(editorState, blockType));
    editorRef.current?.focus();
  };

  const replaceStyleGroup = (prefix: string, style: string) => {
    let next = editorState;
    editorState.getCurrentInlineStyle().forEach((activeStyle) => {
      if (activeStyle?.startsWith(prefix)) {
        next = RichUtils.toggleInlineStyle(next, activeStyle);
      }
    });
    if (!next.getCurrentInlineStyle().has(style)) {
      next = RichUtils.toggleInlineStyle(next, style);
    }
    commit(next);
    editorRef.current?.focus();
  };

  const addLink = () => {
    const selection = editorState.getSelection();
    if (selection.isCollapsed()) {
      window.alert("Bitte zuerst den zu verlinkenden Text markieren.");
      return;
    }
    const url = window.prompt("Linkziel eingeben (https://, mailto:, tel: oder /pfad)");
    if (!url) return;
    if (!(url.startsWith("/") || /^(https?:|mailto:|tel:)/i.test(url))) {
      window.alert("Das Linkziel ist ungültig.");
      return;
    }
    const content = editorState.getCurrentContent();
    const contentWithEntity = content.createEntity("LINK", "MUTABLE", { url });
    const entityKey = contentWithEntity.getLastCreatedEntityKey();
    const stateWithEntity = EditorState.set(editorState, {
      currentContent: contentWithEntity,
    });
    commit(RichUtils.toggleLink(stateWithEntity, selection, entityKey));
  };

  const removeLink = () => {
    commit(RichUtils.toggleLink(editorState, editorState.getSelection(), null));
  };

  return (
    <div className='overflow-hidden rounded-md border border-slate-300 bg-white'>
      <div className='flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-2'>
        <select
          className={BUTTON_CLASS}
          value={editorState.getCurrentContent().getBlockForKey(editorState.getSelection().getStartKey()).getType()}
          onChange={(event) => toggleBlockType(event.target.value)}
          aria-label='Absatzformat'>
          <option value='unstyled'>Absatz</option>
          <option value='header-one'>Überschrift 1</option>
          <option value='header-two'>Überschrift 2</option>
          <option value='header-three'>Überschrift 3</option>
          <option value='header-four'>Überschrift 4</option>
          <option value='blockquote'>Zitat</option>
          <option value='code-block'>Codeblock</option>
        </select>
        {[
          ["BOLD", "Fett"],
          ["ITALIC", "Kursiv"],
          ["UNDERLINE", "Unterstrichen"],
          ["STRIKETHROUGH", "Durchgestrichen"],
          ["CODE", "Code"],
        ].map(([style, label]) => (
          <button key={style} type='button' className={BUTTON_CLASS} onClick={() => toggleInlineStyle(style)}>
            {label}
          </button>
        ))}
        <button type='button' className={BUTTON_CLASS} onClick={() => toggleBlockType("unordered-list-item")}>
          Aufzählung
        </button>
        <button type='button' className={BUTTON_CLASS} onClick={() => toggleBlockType("ordered-list-item")}>
          Nummerierung
        </button>
        <label className={`${BUTTON_CLASS} flex items-center gap-1`}>
          Farbe
          <input
            type='color'
            className='h-5 w-6 cursor-pointer border-0 bg-transparent p-0'
            onChange={(event) => replaceStyleGroup("COLOR-", `COLOR-${event.target.value}`)}
          />
        </label>
        <select
          className={BUTTON_CLASS}
          defaultValue=''
          aria-label='Schriftgröße'
          onChange={(event) => {
            if (event.target.value) replaceStyleGroup("FONT_SIZE-", `FONT_SIZE-${event.target.value}`);
            event.target.value = "";
          }}>
          <option value='' disabled>Schriftgröße</option>
          {[12, 14, 16, 18, 20, 24, 28, 32, 40, 48].map((size) => (
            <option key={size} value={size}>{size}px</option>
          ))}
        </select>
        <button type='button' className={BUTTON_CLASS} onClick={addLink}>Link setzen</button>
        <button type='button' className={BUTTON_CLASS} onClick={removeLink}>Link entfernen</button>
      </div>
      <div className='min-h-52 cursor-text p-4' onClick={() => editorRef.current?.focus()}>
        <Editor
          ref={editorRef}
          editorState={editorState}
          onChange={commit}
          handleKeyCommand={handleKeyCommand}
          placeholder='Text eingeben und frei formatieren ...'
          customStyleFn={(styles) => {
            const result: React.CSSProperties = {};
            styles.forEach((style) => {
              if (style?.startsWith("COLOR-")) result.color = style.slice(6);
              if (style?.startsWith("FONT_SIZE-")) result.fontSize = `${style.slice(10)}px`;
            });
            return result;
          }}
        />
      </div>
    </div>
  );
}

export function SimpleRichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return <RichTextEditor field={{ onChange }} defaultValue={value} />;
}
