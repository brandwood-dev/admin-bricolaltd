import React, { useState, useCallback } from 'react';
import { Plus, GripVertical, Trash2, Image, FileText, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Paragraph {
  id: string;
  content: string;
  orderIndex: number;
}

interface SectionImage {
  id: string;
  url: string;
  alt?: string;
  orderIndex: number;
  file?: File; // Store the actual file for upload
}

interface Section {
  id: string;
  title: string;
  orderIndex: number;
  paragraphs: Paragraph[];
  images: SectionImage[];
}

interface SectionEditorProps {
  sections: Section[];
  onSectionsChange: (sections: Section[]) => void;
  onImageUpload?: (sectionId: string, file: File, alt?: string) => Promise<{ url: string }>;
  onImageQueue?: (sectionId: string, file: File, tempImageId: string, alt?: string) => void;
}

const SectionEditor: React.FC<SectionEditorProps> = ({ sections, onSectionsChange, onImageUpload, onImageQueue }) => {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set());

  console.log('SectionEditor - Received sections:', sections);
  console.log('SectionEditor - Number of sections:', sections?.length);

  const addSection = useCallback(() => {
    const newSection: Section = {
      id: `temp-${Date.now()}`, // Mark as temporary until saved
      title: 'Nouvelle Section',
      orderIndex: sections.length,
      paragraphs: [],
      images: [],
    };
    onSectionsChange([...sections, newSection]);
  }, [sections, onSectionsChange]);

  const updateSection = useCallback((sectionId: string, updates: Partial<Section>) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    );
    onSectionsChange(updatedSections);
  }, [sections, onSectionsChange]);

  const deleteSection = useCallback((sectionId: string) => {
    const updatedSections = sections
      .filter(section => section.id !== sectionId)
      .map((section, index) => ({ ...section, orderIndex: index }));
    onSectionsChange(updatedSections);
  }, [sections, onSectionsChange]);

  const addParagraph = useCallback((sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) {
      console.log('SectionEditor - Section not found for adding paragraph:', sectionId);
      return;
    }

    console.log('SectionEditor - Adding paragraph to section:', sectionId);
    const newParagraph: Paragraph = {
      id: `para-${Date.now()}`,
      content: '',
      orderIndex: section.paragraphs.length,
    };

    updateSection(sectionId, {
      paragraphs: [...section.paragraphs, newParagraph],
    });
    console.log('SectionEditor - Paragraph added successfully');
  }, [sections, updateSection]);

  const updateParagraph = useCallback((sectionId: string, paragraphId: string, content: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const updatedParagraphs = section.paragraphs.map(para =>
      para.id === paragraphId ? { ...para, content } : para
    );

    updateSection(sectionId, { paragraphs: updatedParagraphs });
  }, [sections, updateSection]);

  const deleteParagraph = useCallback((sectionId: string, paragraphId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const updatedParagraphs = section.paragraphs
      .filter(para => para.id !== paragraphId)
      .map((para, index) => ({ ...para, orderIndex: index }));

    updateSection(sectionId, { paragraphs: updatedParagraphs });
  }, [sections, updateSection]);

  const addImage = useCallback((sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) {
      console.log('SectionEditor - Section not found for adding image:', sectionId);
      return;
    }

    console.log('SectionEditor - Adding image to section:', sectionId);
    const newImage: SectionImage = {
      id: `img-${Date.now()}`,
      url: '',
      alt: '',
      orderIndex: section.images.length,
    };

    updateSection(sectionId, {
      images: [...section.images, newImage],
    });
    console.log('SectionEditor - Image added successfully');
  }, [sections, updateSection]);

  const updateImage = useCallback((sectionId: string, imageId: string, updates: Partial<SectionImage>) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const updatedImages = section.images.map(img =>
      img.id === imageId ? { ...img, ...updates } : img
    );

    updateSection(sectionId, { images: updatedImages });
  }, [sections, updateSection]);

  const deleteImage = useCallback((sectionId: string, imageId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const updatedImages = section.images
      .filter(img => img.id !== imageId)
      .map((img, index) => ({ ...img, orderIndex: index }));

    updateSection(sectionId, { images: updatedImages });
  }, [sections, updateSection]);

  const handleImageUpload = useCallback(async (sectionId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('[SectionEditor] No file selected');
      return;
    }

    const section = sections.find(s => s.id === sectionId);
    if (!section) {
      console.log('[SectionEditor] Section not found');
      return;
    }

    const tempImageId = `temp-upload-${Date.now()}`;
    const tempUrl = URL.createObjectURL(file);

    console.log('[SectionEditor] Creating temporary image with file:', {
      tempImageId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      sectionId: sectionId,
      tempUrl
    });

    // Create temporary image with file stored for later upload
    const tempImage: SectionImage = {
      id: tempImageId,
      url: tempUrl,
      alt: '',
      orderIndex: section.images.length || 0,
      file: file // Store the actual file
    };

    updateSection(sectionId, { images: [...section.images, tempImage] });

    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  }, [sections, updateSection]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Sections de l'article</h3>
        <button
          onClick={addSection}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une section</span>
        </button>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Aucune section pour le moment</p>
          <button
            onClick={addSection}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Créer la première section
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <div
              key={section.id}
              className={`border rounded-lg bg-white shadow-sm transition-all ${
                activeSection === section.id ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'
              }`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 flex-1">
                    <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSection(section.id, { title: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Titre de la section"
                    />
                  </div>
                  <button
                    onClick={() => deleteSection(section.id)}
                    className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Paragraphes */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Paragraphes</h4>
                      <button
                        onClick={() => addParagraph(section.id)}
                        className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Ajouter</span>
                      </button>
                    </div>

                    {section.paragraphs.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">Aucun paragraphe</p>
                    ) : (
                      <div className="space-y-2">
                        {section.paragraphs.map((paragraph) => (
                          <div key={paragraph.id} className="flex space-x-2">
                            <textarea
                              value={paragraph.content}
                              onChange={(e) => updateParagraph(section.id, paragraph.id, e.target.value)}
                              placeholder="Contenu du paragraphe"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                              rows={3}
                            />
                            <button
                              onClick={() => deleteParagraph(section.id, paragraph.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Images */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Images</h4>
                      <div className="flex space-x-2">
                        {onImageUpload && (
                          <label className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors cursor-pointer">
                            <Upload className="w-3 h-3" />
                            <span>Télécharger</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(section.id, e)}
                              className="hidden"
                            />
                          </label>
                        )}
                        <button
                          onClick={() => addImage(section.id)}
                          className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          <Image className="w-3 h-3" />
                          <span>URL</span>
                        </button>
                      </div>
                    </div>

                    {section.images.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">Aucune image</p>
                    ) : (
                      <div className="space-y-2">
                        {section.images.map((image) => (
                          <div key={image.id} className="flex space-x-2 items-start">
                            {uploadingImages.has(image.id) ? (
                              <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-md">
                                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                <span className="text-sm text-blue-600">Téléversement...</span>
                              </div>
                            ) : (
                              <>
                                <input
                                  type="url"
                                  value={image.url}
                                  onChange={(e) => updateImage(section.id, image.id, { url: e.target.value })}
                                  placeholder="URL de l'image"
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                  type="text"
                                  value={image.alt || ''}
                                  onChange={(e) => updateImage(section.id, image.id, { alt: e.target.value })}
                                  placeholder="Texte alternatif"
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                  onClick={() => deleteImage(section.id, image.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SectionEditor;