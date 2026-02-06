import React, { useState, useEffect } from 'react';
import { Blog } from '../types';

interface BlogEditorProps {
    blog?: Blog | null;
    onSave: (data: { title: string; content: string }) => void;
    onCancel: () => void;
    isSaving?: boolean;
}

const BlogEditor: React.FC<BlogEditorProps> = ({ blog, onSave, onCancel, isSaving = false }) => {
    const [title, setTitle] = useState(blog?.title || '');
    const [content, setContent] = useState(blog?.content || '');
    const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

    useEffect(() => {
        if (blog) {
            setTitle(blog.title);
            setContent(blog.content);
        }
    }, [blog]);

    const validate = () => {
        const newErrors: { title?: string; content?: string } = {};

        if (!title.trim()) {
            newErrors.title = 'Title is required';
        } else if (title.length < 5) {
            newErrors.title = 'Title must be at least 5 characters';
        }

        if (!content.trim()) {
            newErrors.content = 'Content is required';
        } else if (content.length < 20) {
            newErrors.content = 'Content must be at least 20 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSave({ title: title.trim(), content: content.trim() });
        }
    };

    const isEditing = !!blog;

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <button
                onClick={onCancel}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 mb-6"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Cancel
            </button>

            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
                <h1 className="text-2xl font-bold text-slate-900 mb-8">
                    {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-2">
                            Title
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter blog post title..."
                            className={`w-full px-4 py-3 rounded-xl border ${errors.title ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-[var(--primary)]'} focus:outline-none focus:ring-2 transition-all text-slate-800`}
                            disabled={isSaving}
                        />
                        {errors.title && (
                            <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="content" className="block text-sm font-semibold text-slate-700 mb-2">
                            Content
                        </label>
                        <textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your blog post content here..."
                            rows={12}
                            className={`w-full px-4 py-3 rounded-xl border ${errors.content ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-[var(--primary)]'} focus:outline-none focus:ring-2 transition-all text-slate-800 resize-none`}
                            disabled={isSaving}
                        />
                        {errors.content && (
                            <p className="mt-1 text-sm text-red-500">{errors.content}</p>
                        )}
                        <p className="mt-1 text-xs text-slate-400">
                            {content.length} characters
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-3 bg-[var(--primary)] text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-[var(--primary-shadow)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    {isEditing ? 'Update Post' : 'Publish Post'}
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSaving}
                            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BlogEditor;
