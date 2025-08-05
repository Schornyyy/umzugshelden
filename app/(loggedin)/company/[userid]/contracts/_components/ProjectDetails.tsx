"use client";

import React from "react";

interface ProjectDetailsProps {
  contractData: {
    type: string;
    gardenSize: number;
    contractSize: string;
    gardenLocation: string;
    projektBeginn: string;
    planningAvaillable: boolean;
    repeatService: boolean;
    createdAt: Date;
    description: string;
  };
}

const locationMap: Record<string, string> = {
  front: "Vordergarten",
  back: "Hintergarten",
  side: "Seitengarten",
};

const projectTypeMap: Record<string, string> = {
  "small changes": "Kleine Änderungen",
  "large changes": "Große Änderungen",
  new: "Neubau",
};

const projectBegin: Record<string, string> = {
  _fast: "Schnell",
  _1month: "In 1 Monat",
  _2weeks: "In 2 Wochen",
  _fewmonths: "In wenigen Monaten",
  _request: "Auf Anfrage",
};

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  contractData,
}) => {
  return (
    <div className='mb-4'>
      <h5 className='font-medium text-green-700 mb-2'>Projektinformationen:</h5>
      <div className='grid grid-cols-2 gap-4 text-sm mb-3'>
        <div>
          <span className='font-medium'>Service-Typ:</span> {contractData.type}
        </div>
        <div>
          <span className='font-medium'>Fläche:</span> {contractData.gardenSize}
          m²
        </div>
        <div>
          <span className='font-medium'>Projektumfang:</span>{" "}
          {projectTypeMap[contractData.contractSize] ||
            contractData.contractSize}
        </div>
        <div>
          <span className='font-medium'>Gartenbereich:</span>{" "}
          {locationMap[contractData.gardenLocation] ||
            contractData.gardenLocation}
        </div>
        <div>
          <span className='font-medium'>Projektbeginn:</span>{" "}
          {projectBegin[`_${contractData.projektBeginn}`] ||
            contractData.projektBeginn}
        </div>
        <div>
          <span className='font-medium'>Planung verfügbar:</span>{" "}
          {contractData.planningAvaillable ? "Ja" : "Nein"}
        </div>
        <div>
          <span className='font-medium'>Wiederkehrend:</span>{" "}
          {contractData.repeatService ? "Ja" : "Nein"}
        </div>
        <div>
          <span className='font-medium'>Erstellt am:</span>{" "}
          {new Date(contractData.createdAt).toLocaleDateString("de-DE")}
        </div>
      </div>

      <div className='mb-3'>
        <span className='font-medium'>Projektbeschreibung:</span>
        <p className='text-sm text-gray-700 mt-1 bg-white p-2 rounded border'>
          {contractData.description}
        </p>
      </div>
    </div>
  );
};
