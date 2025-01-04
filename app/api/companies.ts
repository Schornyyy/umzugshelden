import { NextApiRequest, NextApiResponse } from "next";
import {getAllCompanies} from "../../actions/companyActions";

export default async function GET(req: NextApiRequest, res: NextApiResponse) {
  try {
    const companies = await getAllCompanies();
    res.status(200).json(companies.map((company) => ({id: company.id})));
  } catch (error) {
    console.error('Fehler beim Abrufen der Unternehmen:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Unternehmen' });
  }
}
