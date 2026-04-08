import React, { useState, useCallback, useRef } from 'react'
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native'
import { IconX, IconChevronLeft, IconChevronRight } from '@tabler/icons-react-native'
import { ThemedText } from './themed-text'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

interface ImagePreviewItem {
  uri: string
  name?: string
}

interface ImagePreviewModalProps {
  visible: boolean
  images: ImagePreviewItem[]
  initialIndex?: number
  onClose: () => void
}

export function ImagePreviewModal({ visible, images, initialIndex = 0, onClose }: ImagePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const flatListRef = useRef<FlatList>(null)
  const insets = useSafeAreaInsets()

  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0)
    }
  }, [])

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current

  if (!visible || images.length === 0) return null

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent transparent>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
          {images.length > 1 && (
            <ThemedText style={styles.counter}>
              {currentIndex + 1} / {images.length}
            </ThemedText>
          )}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconX size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Image gallery */}
        <FlatList
          ref={flatListRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          keyExtractor={(item, index) => item.uri || `img-${index}`}
          renderItem={({ item }) => (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: item.uri }}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
          )}
        />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  counter: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.85,
  },
})
