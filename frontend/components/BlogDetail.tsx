import React from 'react';
import { Blog } from '../types';

interface BlogDetailProps {
    blog: Blog;
    isAdmin: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onBack: () => void;
}

const BlogDetail: React.FC<BlogDetailProps> = ({ blog, isAdmin, onEdit, onDelete, onBack }) => {
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
            onDelete();
        }
    };

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <button
                onClick={onBack}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 mb-6"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Blog
            </button>

            <article className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
                <header className="mb-8 pb-8 border-b border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 bg-[var(--primary-soft)] text-[var(--primary-text)] text-[10px] font-bold rounded-full uppercase tracking-widest">
                            Blog
                        </span>
                        <span className="text-sm text-slate-400">
                            {formatDate(blog.createdAt)}
                        </span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                        {blog.title}
                    </h1>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary-text)] font-bold">
                            {(blog.authorName || blog.authorEmail)[0].toUpperCase()}
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800">
                                {blog.authorName || blog.authorEmail.split('@')[0]}
                            </p>
                            <p className="text-sm text-slate-400">{blog.authorEmail}</p>
                        </div>
                    </div>
                </header>

                <div className="prose prose-slate max-w-none">
                    {blog.content.split('\n').map((paragraph, index) => (
                        paragraph.trim() && (
                            <p key={index} className="text-slate-600 leading-relaxed mb-4">
                                {paragraph}
                            </p>
                        )
                    ))}
                </div>

                {blog.updatedAt !== blog.createdAt && (
                    <p className="mt-8 pt-4 border-t border-slate-100 text-sm text-slate-400 italic">
                        Last updated: {formatDate(blog.updatedAt)}
                    </p>
                )}

                {isAdmin && (
                    <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
                        <button
                            onClick={onEdit}
                            className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                        </button>
                        <button
                            onClick={handleDelete}
                            className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-all flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                        </button>
                    </div>
                )}
            </article>
        </div>
    );
};

export default BlogDetail;
