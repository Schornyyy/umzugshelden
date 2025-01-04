import { NextResponse } from 'next/server';
import { getAllCompanies } from "../../../actions/companyActions";

export async function GET() {
  try {
    const companies = await getAllCompanies();

    // Eine JSON-Antwort zurückgeben
    return NextResponse.json(companies.map((company) => ({ id: company.id })));
  } catch (error) {
    console.error('Fehler beim Abrufen der Unternehmen:', error);

    // Falls ein Fehler auftritt, eine Fehlerantwort zurückgeben
    return NextResponse.json({ error: 'Fehler beim Abrufen der Unternehmen' }, { status: 500 });
  }
}
