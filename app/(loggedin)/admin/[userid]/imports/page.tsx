/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import * as XLSX from "xlsx";
import { CompanyType } from "@/types/RegisterTypye";
import { createCompanyInDatabase } from "@/actions/companyActions";
import { getAllServices } from "@/types/ServiceType";
import { fetchCoordinates } from "@/actions/userActions";
import { ContentState, convertToRaw } from "draft-js";

export default function CompanyImporter() {
  const { register, handleSubmit, reset } = useForm();
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);
  const [fileCount, setFileCount] = useState<number>(0);

  async function parseFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target?.result as string, { type: "binary" });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(sheet);
          resolve(json as any[]);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  }

  const handleFilePreview = async (data: any) => {
    const files: File[] = Array.from((data.file as FileList) ?? []);
    if (!files.length) return;

    setFileCount(files.length);

    // Parse all selected files and combine
    const results = await Promise.all(files.map((f) => parseFile(f)));
    const combined = results.flat();
    setPreviewData(combined);
  };

  function generateDraftJSDescription(text: string): string {
    const contentState = ContentState.createFromText(text);
    const rawContent = convertToRaw(contentState);
    return JSON.stringify(rawContent);
  }

  const handleUpload = async () => {
    if (!previewData.length) return;

    setUploading(true);
    const total = previewData.length;
    let current = 0;

    for (const entry of previewData) {
      const city = entry.ort || "Ihrer Region";
      const seoText = `Als erfahrener Galabauer in ${city} bieten wir Ihnen umfassende Dienstleistungen im Garten- und Landschaftsbau – individuell geplant, fachgerecht umgesetzt und auf Ihre Wünsche abgestimmt. Unser Angebot reicht von der professionellen Gartenpflege über die kreative Neugestaltung von Außenanlagen bis hin zu Pflasterarbeiten, Zaunbau und dem Bau von Terrassen, Wegen und Natursteinmauern. 

Egal ob privater Garten, Gewerbefläche oder öffentliches Grün – wir gestalten naturnahe Lebensräume mit Qualität, Leidenschaft und einem geschulten Auge fürs Detail. Mit modernen Maschinen, nachhaltigen Materialien und erfahrenem Personal setzen wir Projekte jeder Größe zuverlässig um.

Vertrauen Sie auf einen zuverlässigen Partner vor Ort – Ihr Galabauer in ${city}, wenn es um Gartenbau, Landschaftsgestaltung und langfristige Pflege Ihrer Grünflächen geht. Vereinbaren Sie jetzt ein unverbindliches Beratungsgespräch und lassen Sie sich individuell von uns beraten.`;

      const description = generateDraftJSDescription(seoText);

      const company: CompanyType = {
        email: entry.email,
        type: "company",
        companyName: entry.name || entry.firmenname,
        companyWebsite: entry.website,
        companyEmail: entry.email,
        ownerid: crypto.randomUUID(),
        services: getAllServices(),
        city: entry.ort,
        zip: entry.postleitzahl,
        public: true,
        companyNumber: entry.telefonnummer,
        id: crypto.randomUUID(),
        title: entry.name || entry.firmenname,
        description: description,
        automatic: true,
      };

      await fetchCoordinates(company.city!, company.zip!).then((res) => {
        if (res) {
          company.longitude = res.longitude;
          company.latitude = res.latitude;
        }
      });

      await createCompanyInDatabase(company);
      current++;
      setProgress(Math.round((current / total) * 100));
    }

    setUploading(false);
    setPreviewData([]);
    setFileCount(0);
    reset();
  };

  return (
    <div className=''>
      <form onSubmit={handleSubmit(handleFilePreview)} className='space-y-4'>
        <Input
          type='file'
          multiple
          {...register("file")}
          accept='.xlsx, .xls, .csv'
        />
        <Button type='submit'>Vorschau anzeigen</Button>
      </form>

      {fileCount > 0 && (
        <p className='text-sm text-gray-600 mt-2'>
          Ausgewählte Dateien: {fileCount}
        </p>
      )}

      {previewData.length > 0 && (
        <div className='overflow-auto border border-gray-300 rounded-lg mt-6'>
          <table className='w-full table-auto text-sm text-left'>
            <thead className='bg-gray-100'>
              <tr>
                <th className='p-2 border'>Firmenname</th>
                <th className='p-2 border'>Straße</th>
                <th className='p-2 border'>Telefon</th>
                <th className='p-2 border'>Website</th>
                <th className='p-2 border'>E-Mail</th>
                <th className='p-2 border'>Ort</th>
                <th className='p-2 border'>Postleitzahl</th>
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, idx) => (
                <tr key={idx} className='hover:bg-gray-50'>
                  <td className='p-2 border'>{row.firmenname || row.name}</td>
                  <td className='p-2 border'>{row.straße}</td>
                  <td className='p-2 border'>{row.telefonnummer}</td>
                  <td className='p-2 border'>{row.website}</td>
                  <td className='p-2 border'>{row.email}</td>
                  <td className='p-2 border'>{row.ort}</td>
                  <td className='p-2 border'>{row.postleitzahl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {previewData.length > 0 && !uploading && (
        <Button onClick={handleUpload}>Import starten</Button>
      )}

      {uploading && (
        <>
          <div className='w-full bg-gray-200 rounded-full h-4'>
            <div
              className='bg-blue-600 h-4 rounded-full transition-all'
              style={{ width: `${progress}%` }}></div>
          </div>
          <p className='text-sm text-gray-600'>{progress}% hochgeladen</p>
        </>
      )}
    </div>
  );
}
