import React, { useEffect, useMemo, useRef, useState } from 'react'
import Input from '../input'
import AutoCompleteItem from './auto-complete-item'
import AutoCompleteDropdown from './auto-complete-dropdown'
import AutoCompleteSearching from './auto-complete-searching'
import AutoCompleteEmpty from './auto-complete-empty'
import { AutoCompleteContext, AutoCompleteConfig } from './auto-complete-context'
import { NormalSizes, NormalTypes } from '../utils/prop-types'
import ButtonLoading from '../button/button.loading'
import { pickChild } from 'components/utils/collections'

export type AutoCompleteOption = {
  label: string
  value: string
}

export type AutoCompleteOptions = Array<AutoCompleteOption | typeof AutoCompleteItem>

interface Props {
  options: AutoCompleteOptions
  size?: NormalSizes
  status?: NormalTypes
  initialValue?: string
  value?: string
  width?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  onSelect?: (value: string) => void
  searching?: boolean | undefined
  clearable?: boolean
  className?: string
}

const defaultProps = {
  options: [],
  initialValue: '',
  disabled: false,
  clearable: false,
  size: 'medium' as NormalSizes,
  className: '',
}

export type AutoCompleteProps = Props & typeof defaultProps & React.InputHTMLAttributes<any>

const childrenToOptionsNode = (options: AutoCompleteOptions) => {
  if (options.length === 0) return null
  
  return options.map((item, index) => {
    const key = `auto-complete-item-${index}`
    if (React.isValidElement(item)) return React.cloneElement(item, { key })
    const validItem = item as AutoCompleteOption
    return (
      <AutoCompleteItem key={key}
        value={validItem.value}>
        {validItem.label}
      </AutoCompleteItem>
    )
  })
}

// When the search is not set, the "clearable" icon can be displayed in the original location.
// When the search is seted, at least one element should exist to avoid re-render.
const getSearchIcon = (searching?: boolean) => {
  if (searching === undefined) return null
  return searching ? <ButtonLoading bgColor="transparent" /> : <span />
}

const AutoComplete: React.FC<React.PropsWithChildren<AutoCompleteProps>> = ({
  options, initialValue: customInitialValue, onSelect, onSearch, onChange,
  searching, children, size, status, value, width, clearable, ...props
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<string>(customInitialValue)
  const [visible, setVisible] = useState<boolean>(false)
  const [, searchChild] = pickChild(children, AutoCompleteSearching)
  const [, emptyChild] = pickChild(children, AutoCompleteEmpty)
  const autoCompleteItems = useMemo(() => {
    const hasSearchChild = searchChild && React.Children.count(searchChild) > 0
    const hasEmptyChild = emptyChild && React.Children.count(emptyChild) > 0
    if (searching) {
      return hasSearchChild ? searchChild : <AutoCompleteSearching>Searching...</AutoCompleteSearching>
    }
    if (options.length === 0) {
      if (state === '') return null
      return hasEmptyChild ? emptyChild : <AutoCompleteEmpty>No Options</AutoCompleteEmpty>
    }
    return childrenToOptionsNode(options)
  }, [searching, options])
  const showClearIcon = useMemo(
    () => clearable && searching === undefined,
    [clearable, searching],
  )
  
  const updateValue = (val: string) => {
    onSelect && onSelect(val)
    setState(val)
  }
  const updateVisible = (next: boolean) => setVisible(next)
  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearch && onSearch(event.target.value)
    setState(event.target.value)
  }
  
  useEffect(() => onChange && onChange(state), [state])
  useEffect(() => {
    if (value === undefined) return
    setState(value)
  }, [value])
  
  const initialValue = useMemo<AutoCompleteConfig>(() => ({
    ref, size,
    value: state,
    updateValue,
    visible,
    updateVisible,
  }), [state, visible, size])
  
  const toggleFocusHandler = (next: boolean) => {
    setVisible(next)
    if (next) {
      onSearch && onSearch(state)
    }
  }
  
  const inputProps = {
    ...props,
    width,
    value: state,
  }

  return (
    <AutoCompleteContext.Provider value={initialValue}>
      <div ref={ref} className="auto-complete">
        <Input size={size} status={status}
          onChange={onInputChange}
          onFocus={() => toggleFocusHandler(true)}
          onBlur={() => toggleFocusHandler(false)}
          clearable={showClearIcon}
          iconRight={getSearchIcon(searching)}
          {...inputProps} />
        <AutoCompleteDropdown visible={visible}>
          {autoCompleteItems}
        </AutoCompleteDropdown>

        <style jsx>{`
          .auto-complete {
            width: ${width || 'max-content'};
          }
        `}</style>
      </div>
    </AutoCompleteContext.Provider>
  )
}

type AutoCompleteComponent<P = {}> = React.FC<P> & {
  Item: typeof AutoCompleteItem
  Option: typeof AutoCompleteItem
  Searching: typeof AutoCompleteSearching
  Empty: typeof AutoCompleteEmpty
}

type ComponentProps = Partial<typeof defaultProps> & Omit<Props, keyof typeof defaultProps>

(AutoComplete as AutoCompleteComponent<ComponentProps>).defaultProps = defaultProps

export default AutoComplete as AutoCompleteComponent<ComponentProps>
