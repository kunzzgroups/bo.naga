/**
 * Layout Section — CodeMirror 6 hosts (HTML / CSS / JS).
 * Requires importmap on the page (see layout-section.html) so all @codemirror/*
 * packages share one @codemirror/state instance.
 */
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  dropCursor,
} from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import {
  syntaxHighlighting,
  HighlightStyle,
  foldGutter,
  bracketMatching,
  indentOnInput,
  defaultHighlightStyle,
} from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { lintKeymap } from '@codemirror/lint';

function isDark() {
  return document.documentElement.getAttribute('data-bo-theme') === 'dark';
}

const lightHighlight = HighlightStyle.define([
  { tag: t.comment, color: '#57534E', fontStyle: 'italic' },
  { tag: t.keyword, color: '#7F1D1D', fontWeight: '700' },
  { tag: [t.string, t.special(t.string)], color: '#9A3412', fontWeight: '600' },
  { tag: [t.number, t.bool, t.null, t.atom, t.unit], color: '#7C2D12', fontWeight: '600' },
  { tag: [t.tagName, t.angleBracket], color: '#14532D', fontWeight: '700' },
  { tag: [t.attributeName], color: '#78350F', fontWeight: '600' },
  { tag: [t.propertyName, t.definition(t.propertyName)], color: '#1C1917', fontWeight: '700' },
  { tag: [t.className, t.typeName, t.definition(t.className), t.definition(t.typeName)], color: '#9A3412', fontWeight: '700' },
  { tag: [t.variableName, t.name, t.operator, t.punctuation, t.separator, t.bracket], color: '#0C0A09', fontWeight: '600' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: '#9A3412', fontWeight: '700' },
  { tag: [t.meta, t.modifier], color: '#44403C', fontWeight: '600' },
  { tag: t.color, color: '#9A3412', fontWeight: '600' },
  { tag: t.invalid, color: '#B91C1C', fontWeight: '700' },
]);

const darkHighlight = HighlightStyle.define([
  { tag: t.comment, color: '#A1A1AA', fontStyle: 'italic' },
  { tag: t.keyword, color: '#F87171', fontWeight: '700' },
  { tag: [t.string, t.special(t.string)], color: '#F59E0B' },
  { tag: [t.number, t.bool, t.null], color: '#FBBF24' },
  { tag: [t.tagName, t.angleBracket], color: '#6EE7B7', fontWeight: '700' },
  { tag: [t.attributeName], color: '#FBBF24' },
  { tag: [t.propertyName], color: '#D4D4D8' },
  { tag: [t.className, t.typeName, t.definition(t.className)], color: '#FBBF24', fontWeight: '700' },
  { tag: [t.variableName, t.operator], color: '#F5F5F4' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: '#FBBF24' },
  { tag: t.meta, color: '#A1A1AA' },
]);

function editorTheme(dark) {
  if (dark) {
    return EditorView.theme({
      '&': {
        height: '100%',
        fontSize: '14px',
        fontWeight: '500',
        backgroundColor: '#2A2C36',
        color: '#F5F5F4',
      },
      '.cm-scroller': {
        fontFamily: 'Consolas, "Cascadia Mono", "SF Mono", ui-monospace, Menlo, Monaco, monospace',
        lineHeight: '1.6',
        fontWeight: '500',
      },
      '.cm-content': {
        caretColor: '#F5F5F4',
        padding: '14px 0',
        fontWeight: '500',
      },
      '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#FBBF24' },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: 'rgba(245,158,11,.28)',
      },
      '.cm-activeLine': { backgroundColor: 'rgba(245,158,11,.08)' },
      '.cm-gutters': {
        backgroundColor: '#1F2128',
        color: '#A1A1AA',
        border: 'none',
        borderRight: '1px solid rgba(255,255,255,.12)',
        fontWeight: '600',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'rgba(245,158,11,.12)',
        color: '#FBBF24',
      },
      '.cm-lineNumbers .cm-gutterElement': {
        minWidth: '2.6em',
        padding: '0 8px 0 6px',
      },
    }, { dark: true });
  }

  return EditorView.theme({
    '&': {
      height: '100%',
      fontSize: '14px',
      fontWeight: '600',
      backgroundColor: '#FFF8EB',
      color: '#0C0A09',
    },
    '.cm-scroller': {
      fontFamily: 'Consolas, "Cascadia Mono", "SF Mono", ui-monospace, Menlo, Monaco, monospace',
      lineHeight: '1.6',
      fontWeight: '600',
      backgroundColor: '#FFF8EB',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    },
    '.cm-content': {
      caretColor: '#0C0A09',
      padding: '14px 0',
      backgroundColor: '#FFF8EB',
      color: '#0C0A09',
      fontWeight: '600',
    },
    '.cm-line': {
      fontWeight: '600',
    },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#D97706', borderLeftWidth: '2px' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'rgba(217,119,6,.22)',
    },
    '.cm-activeLine': { backgroundColor: 'rgba(217,119,6,.05)' },
    '.cm-gutters': {
      backgroundColor: '#FFF8EB',
      color: '#44403C',
      border: 'none',
      borderRight: '1px solid #EADCC8',
      fontWeight: '700',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(217,119,6,.08)',
      color: '#9A3412',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      minWidth: '2.6em',
      padding: '0 8px 0 6px',
    },
  }, { dark: false });
}

function langExtension(lang) {
  if (lang === 'html') return html();
  if (lang === 'css') return css();
  return javascript();
}

function prepareHost(textarea) {
  const editorRoot = textarea.closest('.layout-code-editor');
  if (!editorRoot) return null;

  editorRoot.classList.add('is-cm6');
  const lineBox = editorRoot.querySelector('.layout-line-numbers');
  const wrap = editorRoot.querySelector('.layout-code-input-wrap');
  if (lineBox) lineBox.hidden = true;
  if (wrap) wrap.hidden = true;

  let host = editorRoot.querySelector('.layout-cm6-host');
  if (!host) {
    host = document.createElement('div');
    host.className = 'layout-cm6-host';
    host.setAttribute('role', 'presentation');
    editorRoot.appendChild(host);
  }

  textarea.classList.add('layout-cm6-mirror');
  textarea.setAttribute('aria-hidden', 'true');
  textarea.tabIndex = -1;

  editorRoot.style.setProperty('background', '#FFF8EB', 'important');
  editorRoot.style.setProperty('background-color', '#FFF8EB', 'important');
  host.style.setProperty('background', '#FFF8EB', 'important');
  host.style.setProperty('background-color', '#FFF8EB', 'important');

  return { editorRoot, host, textarea, lang: editorRoot.dataset.editorLang || 'js' };
}

function createView(prep) {
  const dark = isDark();
  const startDoc = prep.textarea.value || '';
  const themeComp = new Compartment();
  const highlightComp = new Compartment();

  const view = new EditorView({
    parent: prep.host,
    state: EditorState.create({
      doc: startDoc,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        drawSelection(),
        dropCursor(),
        history(),
        foldGutter(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        highlightSelectionMatches(),
        keymap.of([
          indentWithTab,
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...completionKeymap,
          ...lintKeymap,
        ]),
        langExtension(prep.lang),
        themeComp.of(editorTheme(dark)),
        highlightComp.of(syntaxHighlighting(dark ? darkHighlight : lightHighlight)),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;
          const value = update.state.doc.toString();
          if (prep.textarea.value !== value) {
            prep.textarea.value = value;
            prep.textarea.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }),
      ],
    }),
  });

  view.boThemeComp = themeComp;
  view.boHighlightComp = highlightComp;
  return view;
}

function applyTheme(views) {
  const dark = isDark();
  const theme = editorTheme(dark);
  const highlight = syntaxHighlighting(dark ? darkHighlight : lightHighlight);
  views.forEach((view) => {
    view.dispatch({
      effects: [
        view.boThemeComp.reconfigure(theme),
        view.boHighlightComp.reconfigure(highlight),
      ],
    });
  });
}

/**
 * @param {{ html?: HTMLTextAreaElement|null, css?: HTMLTextAreaElement|null, js?: HTMLTextAreaElement|null }} textareas
 */
export function mountLayoutCodeEditors(textareas) {
  const slots = [
    { key: 'html', el: textareas.html },
    { key: 'css', el: textareas.css },
    { key: 'js', el: textareas.js },
  ].filter((slot) => slot.el);

  const views = {};

  slots.forEach((slot) => {
    const prep = prepareHost(slot.el);
    if (!prep) return;
    views[slot.key] = createView(prep);
  });

  const list = Object.values(views);

  const themeObserver = new MutationObserver(() => applyTheme(list));
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-bo-theme'],
  });

  function get(key) {
    const view = views[key];
    if (view) return view.state.doc.toString();
    const el = textareas[key];
    return el ? el.value || '' : '';
  }

  function set(key, value) {
    const next = value == null ? '' : String(value);
    const view = views[key];
    const el = textareas[key];
    if (el) el.value = next;
    if (!view) return;
    const cur = view.state.doc.toString();
    if (cur === next) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: next },
    });
  }

  return {
    getHtml: () => get('html'),
    getCss: () => get('css'),
    getJs: () => get('js'),
    getValues: () => ({ html: get('html'), css: get('css'), js: get('js') }),
    setValues: (data) => {
      set('html', data?.html || '');
      set('css', data?.css || '');
      set('js', data?.js || '');
    },
    setHtml: (v) => set('html', v),
    setCss: (v) => set('css', v),
    setJs: (v) => set('js', v),
    refreshTheme: () => applyTheme(list),
    destroy: () => {
      themeObserver.disconnect();
      list.forEach((view) => view.destroy());
    },
  };
}

export default mountLayoutCodeEditors;
