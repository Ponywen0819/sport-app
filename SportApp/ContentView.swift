import SwiftUI
import UIKit

struct ContentView: View {
    @State private var selectedTab = 0

    init() {
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor(Color.appBackground)
        appearance.shadowColor = UIColor(Color.appBorder)
        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
        UITabBar.appearance().unselectedItemTintColor = UIColor(Color.appTextTert)
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                HomeView()
            }
            .tabItem {
                Label("首頁", systemImage: selectedTab == 0 ? "house.fill" : "house")
            }
            .tag(0)

            NavigationStack {
                WorkoutsView()
            }
            .tabItem {
                Label("運動", systemImage: selectedTab == 1 ? "dumbbell.fill" : "dumbbell")
            }
            .tag(1)

            NavigationStack {
                NutritionView()
            }
            .tabItem {
                Label("營養", systemImage: selectedTab == 2 ? "leaf.fill" : "leaf")
            }
            .tag(2)

            NavigationStack {
                ProfileView()
            }
            .tabItem {
                Label("我的", systemImage: selectedTab == 3 ? "person.fill" : "person")
            }
            .tag(3)
        }
        .tint(Color.appBlue)
    }
}

#Preview {
    ContentView()
}
