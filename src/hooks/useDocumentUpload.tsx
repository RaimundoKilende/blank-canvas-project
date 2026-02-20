import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useDocumentUpload() {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadDocuments = async (
    userId: string,
    files: File[]
  ): Promise<string[]> => {
    if (files.length === 0) return [];

    setUploading(true);
    setProgress(0);

    const uploadedPaths: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("technician-documents")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        uploadedPaths.push(filePath);
        setProgress(((i + 1) / files.length) * 100);
      }

      toast({
        title: "Documentos enviados!",
        description: `${files.length} documento(s) enviado(s) com sucesso.`,
      });

      return uploadedPaths;
    } catch (error: any) {
      toast({
        title: "Erro ao enviar documentos",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const deleteDocument = async (filePath: string): Promise<void> => {
    try {
      const { error } = await supabase.storage
        .from("technician-documents")
        .remove([filePath]);

      if (error) throw error;

      toast({
        title: "Documento removido",
        description: "O documento foi excluído com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover documento",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    uploading,
    progress,
    uploadDocuments,
    deleteDocument,
  };
}
