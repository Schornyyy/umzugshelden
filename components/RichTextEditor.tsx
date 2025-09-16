/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  EditorState,
  Editor,
  RichUtils,
  convertToRaw,
  convertFromRaw,
} from "draft-js";
import { useState } from "react";
import "draft-js/dist/Draft.css";

export const RichTextEditor = ({
  field,
  defaultValue,
}: {
  field: any;
  defaultValue: string;
}) => {
  // Initialisiere den Editor-State mit dem defaultValue (falls vorhanden)
  const [editorState, setEditorState] = useState(() => {
    if (defaultValue) {
      try {
        const parsedContent = JSON.parse(defaultValue);
        const contentState = convertFromRaw(parsedContent);
        return EditorState.createWithContent(contentState);
      } catch (e: any) {
        console.error(
          "Invalid defaultValue format, initializing with empty editor",
          e
        );
        return EditorState.createEmpty();
      }
    }
    return EditorState.createEmpty();
  });

  // Handhabt Änderungen im Editor und übergibt die Änderungen an das Formular
  const handleEditorChange = (state: EditorState) => {
    setEditorState(state);

    // Konvertiere Editor-Inhalte in einen JSON-String und aktualisiere das Feld
    const contentState = state.getCurrentContent();
    const rawContent = JSON.stringify(convertToRaw(contentState));
    field.onChange(rawContent); // `onChange` an React Hook Form übergeben
  };

  // Handhabt Tastenkürzelbefehle für Formatierungen
  const handleKeyCommand = (command: string) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      handleEditorChange(newState);
      return "handled";
    }
    return "not-handled";
  };

  // Umschaltet den Blocktyp (Absatz, Listen, Überschrift)
  const toggleBlockType = (blockType: string) => {
    const newState = RichUtils.toggleBlockType(editorState, blockType);
    handleEditorChange(newState);
  };

  // Umschaltet den Inline-Stil (z.B. fett, kursiv, unterstrichen)
  const toggleInlineStyle = (style: string) => {
    const newState = RichUtils.toggleInlineStyle(editorState, style);
    handleEditorChange(newState);
  };

  return (
    <div className='border rounded-md p-4'>
      {/* Formatierungs-Toolbar */}
      <div className='mb-4 flex gap-2 flex-row flex-wrap'>
        {/* Inline Style Buttons */}
        <button
          type='button'
          onClick={() => toggleInlineStyle("BOLD")}
          className='px-4 py-2 bg-gray-200 rounded'>
          Bold
        </button>
        <button
          type='button'
          onClick={() => toggleInlineStyle("ITALIC")}
          className='px-4 py-2 bg-gray-200 rounded'>
          Italic
        </button>
        <button
          type='button'
          onClick={() => toggleInlineStyle("UNDERLINE")}
          className='px-4 py-2 bg-gray-200 rounded'>
          Underline
        </button>
        {/* Block Type Buttons */}
        <button
          type='button'
          onClick={() => toggleBlockType("unordered-list-item")}
          className='px-4 py-2 bg-gray-200 rounded'>
          Unordered List
        </button>
        <button
          type='button'
          onClick={() => toggleBlockType("ordered-list-item")}
          className='px-4 py-2 bg-gray-200 rounded'>
          Ordered List
        </button>
        <button
          type='button'
          onClick={() => toggleBlockType("header-one")}
          className='px-4 py-2 bg-gray-200 rounded'>
          Überschrift
        </button>
        <button
          type='button'
          onClick={() => toggleBlockType("header-two")}
          className='px-4 py-2 bg-gray-200 rounded'>
          Kl. Überschrift
        </button>
      </div>

      {/* Der eigentliche Editor */}
      <div
        className='border p-4 rounded bg-white'
        style={{ minHeight: "200px" }}>
        <Editor
          editorState={editorState}
          onChange={handleEditorChange}
          handleKeyCommand={handleKeyCommand}
          placeholder='Gib hier deine Produktbeschreibung ein...'
        />
      </div>
    </div>
  );
};
