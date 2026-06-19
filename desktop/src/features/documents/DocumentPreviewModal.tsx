import { useEffect, useState } from 'react'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { Modal } from '../../components/ui/Modal'
import { errorMessage } from '../../lib/errors'
import { documentsService } from './documentsService'
import type { DocumentItem } from './documentsTypes'

export function DocumentPreviewModal({ document, onClose }: { document: DocumentItem; onClose: () => void }) {
  const [url, setUrl] = useState<string>()
  const [error, setError] = useState('')
  useEffect(() => {
    let currentUrl: string | undefined
    setUrl(undefined)
    setError('')
    const publicUrl = documentsService.previewUrl(document)
    if (publicUrl) {
      setUrl(publicUrl)
      return undefined
    }

    documentsService.preview(document).then((blob) => {
      currentUrl = URL.createObjectURL(blob)
      setUrl(currentUrl)
    }).catch((caught) => setError(errorMessage(caught)))
    return () => { if (currentUrl) URL.revokeObjectURL(currentUrl) }
  }, [document])
  return (
    <Modal title={document.nomeArquivo} onClose={onClose}>
      {error ? <ErrorState message={error} /> : !url ? <LoadingState label="Carregando visualizacao..." /> : <iframe className="document-frame" title={document.nomeArquivo} src={url} />}
    </Modal>
  )
}
