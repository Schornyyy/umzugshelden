"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface EmptyStateProps {
  type: "available" | "purchased";
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type }) => {
  if (type === "available") {
    return (
      <Card>
        <CardContent className='p-8 text-center'>
          <AlertCircle className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Keine verfügbaren Aufträge
          </h3>
          <p className='text-gray-600'>
            Aktuell sind keine Aufträge in Ihrem Umkreis verfügbar. Versuchen
            Sie, den Suchradius zu vergrößern oder die Filter anzupassen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className='p-8 text-center'>
        <CheckCircle className='h-12 w-12 text-gray-400 mx-auto mb-4' />
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>
          Noch keine erworbenen Aufträge
        </h3>
        <p className='text-gray-600'>
          Sie haben noch keine Aufträge erworben. Schauen Sie sich die
          verfügbaren Aufträge an!
        </p>
      </CardContent>
    </Card>
  );
};

interface LoadMoreButtonProps {
  onLoadMore: () => void;
  loading: boolean;
  hasMore: boolean;
}

export const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({
  onLoadMore,
  loading,
  hasMore,
}) => {
  if (!hasMore) return null;

  return (
    <div className='text-center mt-8'>
      <Button onClick={onLoadMore} disabled={loading} variant='outline'>
        {loading ? (
          <>
            <Loader2 className='h-4 w-4 animate-spin mr-2' />
            Lädt...
          </>
        ) : (
          "Weitere Aufträge laden"
        )}
      </Button>
    </div>
  );
};
