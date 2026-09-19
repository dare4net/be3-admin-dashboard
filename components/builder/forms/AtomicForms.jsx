"use client";

import ImageUploader from "@/components/config/ImageUploader";
import { Input, Select, Textarea } from "./FormComponents";

export default function AtomicForms({
    widgetType,
    config,
    updateConfig
}) {
    switch (widgetType) {
        case 'heading':
            return (
                <>
                    <Input label="Heading Text" value={config.text || ''} onChange={v => updateConfig('text', v)} />
                    <Select label="Tag" value={config.tag || 'h2'} onChange={v => updateConfig('tag', v)} options={['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(t => ({ value: t, label: t.toUpperCase() }))} />
                    <Select label="Alignment" value={config.align || 'left'} onChange={v => updateConfig('align', v)} options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} />
                </>
            );

        case 'quote':
            return (
                <>
                    <Textarea label="Quote Text" value={config.text || ''} onChange={v => updateConfig('text', v)} rows={4} />
                    <Input label="Author" value={config.author || ''} onChange={v => updateConfig('author', v)} />
                </>
            );

        case 'text':
            return (
                <>
                    <Textarea label="Content" value={config.content || ''} onChange={v => updateConfig('content', v)} rows={5} />
                    <Input label="Text Color" type="color" value={config.color || '#000000'} onChange={v => updateConfig('color', v)} />
                </>
            );

        case 'image':
            return (
                <>
                    <Input label="Image URL" value={config.url || ''} onChange={v => updateConfig('url', v)} />
                    <Input label="Alt Text" value={config.alt || ''} onChange={v => updateConfig('alt', v)} />
                    <Input label="Caption (optional)" value={config.caption || ''} onChange={v => updateConfig('caption', v)} />
                </>
            );

        case 'divider':
            return (
                <>
                    <Select label="Style" value={config.style || 'solid'} onChange={v => updateConfig('style', v)} options={[{ value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' }]} />
                    <Input label="Color" type="color" value={config.color || '#e5e7eb'} onChange={v => updateConfig('color', v)} />
                    <Input label="Height (px)" type="number" value={parseInt(config.height) || 1} onChange={v => updateConfig('height', `${v}px`)} />
                    <Select label="Width" value={config.width || '100%'} onChange={v => updateConfig('width', v)} options={[{ value: '100%', label: 'Full (100%)' }, { value: '75%', label: 'Wide (75%)' }, { value: '50%', label: 'Half (50%)' }, { value: '25%', label: 'Quarter (25%)' }]} />
                </>
            );

        case 'spacer':
            return (
                <>
                    <Input label="Height (px)" type="number" value={parseInt(config.height) || 32} onChange={v => updateConfig('height', `${v}px`)} />
                    <p className="text-xs text-gray-400 mt-1">Adjust vertical spacing between widgets.</p>
                </>
            );

        case 'header_logo':
            return (
                <>
                    <ImageUploader label="Logo Image" value={config.url || ''} onChange={v => updateConfig('url', v)} />
                    <Input label="Height (px)" type="number" value={config.height || 32} onChange={v => updateConfig('height', parseInt(v))} />
                    <Input label="Alt Text" value={config.altText || ''} onChange={v => updateConfig('altText', v)} />
                </>
            );

        default:
            return null;
    }
}
