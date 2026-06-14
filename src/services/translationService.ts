import { supabase } from '../config/supabase'; 

export const translateText = async (text: string, targetLanguage: string) => {
  try {
      if (!text.trim()) return text;

          // 1. First layer check: Check if the text translation is already cached
              const { data: cachedData, error: cacheError } = await supabase
                    .from('translation_cache')
                          .select('translated_text')
                                .eq('source_text', text)
                                      .eq('target_language', targetLanguage)
                                            .maybeSingle();

                                                if (!cacheError && cachedData) {
                                                      return cachedData.translated_text; 
                                                          }

                                                              // 2. Cache Miss: Securely invoke the edge function to contact Google
                                                                  const { data, error } = await supabase.functions.invoke('google-translate', {
                                                                        body: { text, targetLanguage },
                                                                            });

                                                                                if (error || !data?.translatedText) {
                                                                                      throw new Error(error?.message || 'Invalid translation data response');
                                                                                          }

                                                                                              return data.translatedText;
                                                                                                } catch (error) {
                                                                                                    console.log("Translation pipeline error:", error);
                                                                                                        return text;
                                                                                                          }
                                                                                                          };
