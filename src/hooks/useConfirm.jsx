import { useState, useCallback } from 'react'
import ConfirmModal from '../components/ui/ConfirmModal'

export function useConfirm() {
  const [config, setConfig] = useState(null)

  const confirm = useCallback((opts) => {
    return new Promise((resolve) => {
      setConfig({ ...opts, resolve })
    })
  }, [])

  const handleConfirm = () => {
    config?.resolve(true)
    setConfig(null)
  }

  const handleCancel = () => {
    config?.resolve(false)
    setConfig(null)
  }

  const modal = config ? (
    <ConfirmModal
      title={config.title}
      description={config.description}
      confirmLabel={config.confirmLabel}
      cancelLabel={config.cancelLabel}
      danger={config.danger}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null

  return { confirm, modal }
}
