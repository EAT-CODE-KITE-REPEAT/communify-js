import { Ionicons } from "@expo/vector-icons";
import * as React from "react";
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { RefreshControl } from "react-native-web-refresh-control";
import ImageInput from "../components/ImageInput";
import KeyboardAvoidingSpace from "../components/KeyboardAvoidingSpace";
import Constants from "../Constants";
import { withGlobalContext } from "../GlobalContext";
import STYLE from "../Style";

const { width } = Dimensions.get("window");
const isBigDevice = width > 500;
const maxWidth = isBigDevice ? 500 : width;

const IMAGE_SIZE = 40;

class ChatScreen extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      members: [],
      isFetching: true,
    };
  }

  componentDidMount() {
    const { navigation } = this.props;
    this.fetchChat();
    navigation.setOptions({ headerTitle: "Chat" });
  }

  fetchChat = () => {
    const { global, route } = this.props;

    fetch(
      `${Constants.SERVER_ADDR}/chat?loginToken=${global.device.loginToken}&id=${route.params.id}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    )
      .then((response) => response.json())
      .then((chat) => {
        this.setState({ chat, isFetching: false });
      })
      .catch((error) => {
        console.error(error);
      });
  };

  onRefresh = () => {
    this.setState({ isFetching: true }, function () {
      this.fetchChat();
    });
  };

  renderItem = ({ item, index }) => {
    const { global, navigation } = this.props;
    const isMe = item.user.id === global.me.id;
    const avatar = (
      <TouchableOpacity
        onPress={() => {
          navigation.navigate("profile", { username: item.user.username });
        }}
      >
        <Image
          source={{ uri: Constants.SERVER_ADDR + item.user.thumbnail }}
          style={{
            width: IMAGE_SIZE,
            height: IMAGE_SIZE,
            borderRadius: IMAGE_SIZE / 2,
          }}
        />
      </TouchableOpacity>
    );
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginHorizontal: 10,
          justifyContent: isMe ? "flex-end" : "flex-start",
        }}
      >
        {!isMe ? avatar : null}
        <View
          style={{
            marginVertical: 10,
            marginHorizontal: 10,
            backgroundColor: isMe ? "#d9f6c2" : "white",
            padding: 10,
            borderRadius: 10,
            borderWidth: 0.5,
            borderColor: "#CCC",
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={{ fontWeight: "bold" }}>
              {item.user.name ? item.user.name : item.user.username}
            </Text>
          </View>
          {item.image ? (
            <Image
              source={{
                uri: Constants.SERVER_ADDR + item.image,
              }}
              style={{ width: 200, height: 200 }}
              resizeMode="cover"
            />
          ) : null}

          <Text>{item.message}</Text>
        </View>
        {isMe ? avatar : null}
      </View>
    );
  };

  send = () => {
    const { global, route } = this.props;
    const { image, message, hasEdited } = this.state;

    const url = `${Constants.SERVER_ADDR}/chat`;
    fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        loginToken: global.device.loginToken,
        image: hasEdited ? image : undefined,
        message,
        cid: route.params?.id,
      }),
    })
      .then((response) => response.json())
      .then(({ response, success }) => {
        this.setState({ response });
        if (success) {
          this.fetchChat();
          this.setState({ message: "", image: null });
        }
      })
      .catch((error) => {
        console.log(error, url);
      });
  };

  renderFooter = () => {
    const { global, route } = this.props;
    const { image, message, hasEdited, response } = this.state;
    return global.device.logged ? (
      <View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginHorizontal: 10,
          }}
        >
          <ImageInput
            small
            value={image}
            onChange={(base64) =>
              this.setState({
                hasEdited: true,
                image: base64,
              })
            }
          />

          <TextInput
            onEndEditing={this.send}
            style={[STYLE.textInput, { flex: 1 }]}
            value={message}
            placeholder="Message"
            onChangeText={(message) => this.setState({ message })}
          />

          <TouchableOpacity onPress={this.send}>
            <Ionicons name="ios-send" size={32} />
          </TouchableOpacity>
        </View>
      </View>
    ) : (
      <Text>Login to chat</Text>
    );
  };

  render() {
    const { chat } = this.state;
    return (
      <SafeAreaView style={styles.container}>
        <FlatList
          inverted
          data={chat}
          renderItem={this.renderItem}
          keyExtractor={(item, index) => index.toString()}
          refreshControl={
            <RefreshControl
              refreshing={this.state.isFetching}
              onRefresh={this.onRefresh}
            />
          }
        />
        {this.renderFooter()}
        <KeyboardAvoidingSpace hasTabNav={true} />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
});

export default withGlobalContext(ChatScreen);
